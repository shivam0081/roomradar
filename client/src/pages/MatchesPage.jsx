import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket';
import { AuthContext } from '../contexts/AuthContext';

export default function MatchesPage() {
  const { user } = useContext(AuthContext); // Access user for role-based logic
  const [userMatches, setUserMatches] = useState([]);
  const [roomMatches, setRoomMatches] = useState([]);
  const [shortlisted, setShortlisted] = useState({});
  const [bookingStatus, setBookingStatus] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadShortlist = async () => {
    try {
      const res = await api.get('/shortlist');
      const map = {};
      res.data.forEach((item) => {
        map[item.itemId] = true;
      });
      setShortlisted(map);
    } catch {
      // ignore
    }
  };

  const loadBookings = async () => {
    try {
      const res = await api.get('/bookings');
      const map = {};
      res.data.forEach((req) => {
        if (req.renter?._id === user?.id || req.renter?._id === user?._id) {
          map[req.room?._id] = req.status;
        }
      });
      setBookingStatus(map);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, roomsRes] = await Promise.all([
          api.get('/match/users'),
          api.get('/match/rooms'),
          loadShortlist(),
          loadBookings(),
        ]);
        setUserMatches(usersRes.data);
        setRoomMatches(roomsRes.data);
      } catch (err) {
        setMessage('Failed to load matches. Make sure your profile has preferences set.');
      } finally {
        setLoading(false);
      }
    };
    
    const loadConnections = async () => {
      try {
        const res = await api.get('/connections');
        setConnections(res.data);
      } catch (err) {
        console.error('Failed to load connections', err);
      }
    };

    load();
    loadConnections();
  }, [user]);

  // Real-time listeners
  useEffect(() => {
    if (!user) return;
    const userId = user.id || user._id;

    // Booking status live-sync
    const handleBookingUpdate = (updated) => {
      const renterId = updated.renter?._id || updated.renter;
      if (renterId?.toString() === userId?.toString()) {
        const roomId = updated.room?._id || updated.room;
        setBookingStatus((prev) => ({ ...prev, [roomId]: updated.status }));
      }
    };

    // Connection live-sync
    const handleConnectionUpdate = (updated) => {
      setConnections((prev) => {
        const exists = prev.find((c) => c._id === updated._id);
        if (exists) return prev.map((c) => c._id === updated._id ? updated : c);
        return [updated, ...prev];
      });
    };

    socket.on('bookingUpdate', handleBookingUpdate);
    socket.on('connectionUpdate', handleConnectionUpdate);
    return () => {
      socket.off('bookingUpdate', handleBookingUpdate);
      socket.off('connectionUpdate', handleConnectionUpdate);
    };
  }, [user]);

  const toggleShortlist = async (type, itemId) => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await api.post('/shortlist', { type, itemId });
      setShortlisted((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
      setMessage(res.data.added ? '❤️ Added to favorites' : 'Removed from favorites');
      setTimeout(() => setMessage(null), 2500);
    } catch (err) {
      setMessage('Failed to update favorites');
    } finally {
      setSaving(false);
    }
  };

  const requestBooking = async (roomId) => {
    setMessage(null);
    try {
      await api.post('/bookings', { roomId });
      setBookingStatus((prev) => ({ ...prev, [roomId]: 'pending' }));
      setMessage('📅 Booking request sent!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to request booking');
    }
  };

  const getBookingLabel = (status, seats) => {
    if (status === 'accepted') return 'Booked ✓';
    if (status === 'pending') return 'Requested';
    if (seats <= 0) return 'FULL';
    if (status === 'rejected') return 'Request again';
    return 'Request booking';
  };

  const handleConnect = async (receiverId) => {
    try {
      const res = await api.post('/connections', { receiverId });
      setConnections((prev) => [res.data, ...prev]);
      setMessage('Connection request sent!');
      setTimeout(() => setMessage(null), 2500);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleConnectionAction = async (connId, status) => {
    try {
      const res = await api.put(`/connections/${connId}`, { status });
      setConnections((prev) => prev.map((c) => (c._id === connId ? res.data : c)));
      setMessage(`Connection ${status}`);
      setTimeout(() => setMessage(null), 2500);
    } catch (err) {
      setMessage('Failed to update connection');
    }
  };

  const getConnectionStatus = (targetUserId) => {
    return connections.find(
      (c) =>
        (c.sender?._id === targetUserId && c.receiver?._id === user?.id) ||
        (c.receiver?._id === targetUserId && c.sender?._id === user?.id) ||
        (c.sender === targetUserId && c.receiver === user?.id) ||
        (c.receiver === targetUserId && c.sender === user?.id)
    );
  };

  const ScoreBar = ({ score }) => {
    const pct = Math.min(100, Math.max(0, Math.round(score)));
    const color = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)';
    return (
      <div className="match-score-bar">
        <div className="match-score-label">
          <span>Compatibility</span>
          <span className="match-score-value" style={{ color }}>{pct}%</span>
        </div>
        <div className="match-score-track">
          <div
            className="match-score-fill"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${color}, ${color}aa)`,
            }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page">
        <div className="spinner-wrap"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>💡 Match Suggestions</h1>
      </div>
      {message && <div className="info">{message}</div>}

      <section style={{ marginBottom: '2rem' }}>
        <h2>🏠 Room Matches</h2>
        {roomMatches.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <span className="empty-state-icon">🏠</span>
              <h3>No room matches yet</h3>
              <p>Update your profile with location and lifestyle preferences to get personalized matches.</p>
            </div>
          </div>
        ) : (
          <div className="cards">
            {roomMatches.map(({ room, score }) => (
              <article key={room._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="room-card-title">{room.title}</div>
                  {room.seats <= 0 && <span className="badge badge-full">Sold Out</span>}
                </div>
                {room.description && <p className="room-card-desc">{room.description}</p>}
                <div className="room-card-meta">
                  {room.rent && <span className="rent-badge">₹{room.rent.toLocaleString()}/mo</span>}
                  {room.location && <span className="location-badge">📍 {room.location}</span>}
                  <span className="location-badge" style={room.seats <= 0 ? { color: '#f87171' } : {}}>
                    🪑 {room.seats} / {room.totalCapacity || room.seats} beds available
                  </span>
                  {bookingStatus[room._id] && (
                    <span className={`badge badge-${bookingStatus[room._id]}`}>
                      {bookingStatus[room._id]}
                    </span>
                  )}
                </div>
                <ScoreBar score={score} />
                {room.lifestyleTags?.length > 0 && (
                  <div className="tags" style={{ marginBottom: '0.5rem' }}>
                    {room.lifestyleTags.map((t) => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>
                )}
                <div className="actions">
                  <button
                    type="button"
                    className={`heart-btn ${shortlisted[room._id] ? 'active' : ''}`}
                    disabled={saving}
                    onClick={() => toggleShortlist('room', room._id)}
                  >
                    {shortlisted[room._id] ? '♥' : '♡'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => navigate(`/chat/room/${room._id}`)}>
                    💬 Chat
                  </button>
                  {user?.role === 'renter' && user?.id !== room.owner?._id && (
                    <button
                      type="button"
                      disabled={room.seats <= 0 || bookingStatus[room._id] === 'pending' || bookingStatus[room._id] === 'accepted'}
                      onClick={() => requestBooking(room._id)}
                    >
                      {getBookingLabel(bookingStatus[room._id], room.seats)}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {user?.role !== 'owner' && (
      <section>
        <h2>🤝 Roommate Matches</h2>
        {userMatches.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <span className="empty-state-icon">🤝</span>
              <h3>No roommate matches yet</h3>
              <p>Add lifestyle tags and preferences to your profile to find compatible roommates.</p>
            </div>
          </div>
        ) : (
          <div className="cards">
            {userMatches.map(({ user: matchUser, score }) => {
              const conn = getConnectionStatus(matchUser._id);
              const isReceiver = conn?.receiver?._id === user?.id || conn?.receiver === user?.id;

              return (
                <article key={matchUser._id} className="card">
                <div className="match-user-row">
                  <div className="match-avatar">
                    {matchUser.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="match-user-info">
                    <div className="room-card-title m-0">{matchUser.name}</div>
                    <span className="badge">
                      {matchUser.role === 'owner' ? '🏠 Owner' : '🔍 Renter'}
                    </span>
                  </div>
                </div>
                  <ScoreBar score={score} />
                  {matchUser.lifestyleTags?.length > 0 && (
                    <div className="tags mb-2">
                      {matchUser.lifestyleTags.map((t) => <span key={t} className="tag">{t}</span>)}
                    </div>
                  )}
                  <div className="actions" style={{ flexWrap: 'wrap', gap: '8px' }}>
                    <button
                      type="button"
                      className={`heart-btn ${shortlisted[matchUser._id] ? 'active' : ''}`}
                      disabled={saving}
                      onClick={() => toggleShortlist('user', matchUser._id)}
                    >
                      {shortlisted[matchUser._id] ? '♥' : '♡'}
                    </button>
                    
                    {!conn && (
                      <button type="button" className="btn-secondary" onClick={() => handleConnect(matchUser._id)}>
                        🔗 Connect
                      </button>
                    )}
                    {conn?.status === 'pending' && !isReceiver && (
                      <button type="button" className="btn-secondary outline" disabled>
                        ⏳ Pending
                      </button>
                    )}
                    {conn?.status === 'pending' && isReceiver && (
                      <>
                        <button type="button" className="btn-secondary" onClick={() => handleConnectionAction(conn._id, 'accepted')}>
                          ✓ Accept
                        </button>
                        <button type="button" className="btn-secondary outline" onClick={() => handleConnectionAction(conn._id, 'rejected')}>
                          ✕ Reject
                        </button>
                      </>
                    )}
                    {conn?.status === 'accepted' && (
                      <button type="button" className="btn-secondary" onClick={() => navigate(`/chat/user/${matchUser._id}`)}>
                        💬 Chat
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      )}
    </div>
  );
}
