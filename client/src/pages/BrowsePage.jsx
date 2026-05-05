import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket';
import { AuthContext } from '../contexts/AuthContext';
import FocalView from '../components/FocalView';

export default function BrowsePage() {
  const { user } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState({ location: '', minRent: '', maxRent: '' });
  const [message, setMessage] = useState(null);
  const [bookingStatus, setBookingStatus] = useState({});
  const [shortlisted, setShortlisted] = useState({});
  const [savingShortlist, setSavingShortlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadRooms = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.location) params.location = filters.location;
      if (filters.minRent) params.minRent = filters.minRent;
      if (filters.maxRent) params.maxRent = filters.maxRent;

      const res = await api.get('/rooms', { params });
      setRooms(res.data);
    } catch (err) {
      setMessage('Failed to load rooms.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadRooms();
    if (user) {
      loadBookings();
      loadShortlist();
    }
  }, [user]);

  const loadBookings = async () => {
    try {
      const res = await api.get('/bookings');
      const map = {};
      res.data.forEach((req) => {
        if (req.renter._id === user?.id) {
          map[req.room._id] = req.status;
        }
      });
      setBookingStatus(map);
    } catch {
      // ignore
    }
  };

  const loadShortlist = async () => {
    try {
      const res = await api.get('/shortlist', { params: { type: 'room' } });
      const map = {};
      res.data.forEach((item) => {
        map[item.itemId] = true;
      });
      setShortlisted(map);
    } catch {
      // ignore
    }
  };

  const toggleShortlist = async (roomId) => {
    setSavingShortlist(true);
    try {
      const res = await api.post('/shortlist', { type: 'room', itemId: roomId });
      setShortlisted((prev) => ({ ...prev, [roomId]: !prev[roomId] }));
      setMessage(res.data.added ? '❤️ Added to shortlist' : 'Removed from shortlist');
      setTimeout(() => setMessage(null), 2500);
    } catch (err) {
      setMessage('Failed to update shortlist');
    } finally {
      setSavingShortlist(false);
    }
  };

  const requestBooking = async (roomId) => {
    setMessage(null);
    try {
      await api.post('/bookings', { roomId });
      setBookingStatus((prev) => ({ ...prev, [roomId]: 'pending' }));
      setMessage('📅 Booking request sent! The owner will review it.');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to request booking');
    }
  };

  // Real-time booking status updates
  useEffect(() => {
    if (!user) return;
    const handleBookingUpdate = (updated) => {
      // updated.renter is populated { _id, name, email }
      const renterId = updated.renter?._id || updated.renter;
      if (renterId?.toString() === (user.id || user._id)?.toString()) {
        const roomId = updated.room?._id || updated.room;
        setBookingStatus((prev) => ({ ...prev, [roomId]: updated.status }));
      }
    };
    socket.on('bookingUpdate', handleBookingUpdate);
    return () => socket.off('bookingUpdate', handleBookingUpdate);
  }, [user]);

  const handleShortlist = async (roomId) => {
    if (savingShortlist) return;
    await toggleShortlist(roomId);
  };

  const resetFilters = () => {
    setFilters({ location: '', minRent: '', maxRent: '' });
    loadRooms();
  };

  const getBookingLabel = (status, seats) => {
    if (status === 'accepted') return 'Booked ✓';
    if (status === 'pending') return 'Requested';
    if (seats <= 0) return 'House Full';
    if (status === 'rejected') return 'Request again';
    return 'Request booking';
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Browse Rooms</h1>
        </div>
        {user?.role === 'owner' && (
          <button className="btn outline" type="button" onClick={() => navigate('/create-room')}>
            ➕ List a room
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filter-section">
        <div className="filter-row">
          <label>
            📍 Location
            <input
              value={filters.location}
              onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}
              placeholder="e.g. Bangalore, OMR…"
            />
          </label>
          <label>
            Min rent (₹)
            <input
              type="number"
              value={filters.minRent}
              onChange={(e) => setFilters((p) => ({ ...p, minRent: e.target.value }))}
              placeholder="0"
            />
          </label>
          <label>
            Max rent (₹)
            <input
              type="number"
              value={filters.maxRent}
              onChange={(e) => setFilters((p) => ({ ...p, maxRent: e.target.value }))}
              placeholder="50000"
            />
          </label>
          <div className="filter-actions">
            <button type="button" onClick={loadRooms}>Apply</button>
            <button type="button" className="reset-btn" onClick={resetFilters}>Reset</button>
          </div>
        </div>
      </div>

      {message && <div className="info">{message}</div>}

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : rooms.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-state-icon">🏠</span>
            <h3>No rooms found</h3>
            <p>Try adjusting your filters or reset to show all available rooms.</p>
            <div className="mt-4">
              <button className="btn" type="button" onClick={resetFilters}>
                Reset filters
              </button>
            </div>
          </div>
        </div>
      ) : (
        <section className="cards">
          {rooms.map((room) => (
            <FocalView key={room._id}>
              <article className="card">
                <div className="room-card-title">{room.title}</div>
                {room.description && (
                  <p className="room-card-desc">{room.description}</p>
                )}
                <div className="room-card-meta">
                  <span className="rent-badge">₹{room.rent.toLocaleString()}/mo</span>
                  <span className="location-badge">📍 {room.location}</span>
                  <span className={`location-badge ${room.seats <= 0 ? 'text-error' : ''}`}>
                    🪑 {room.seats} / {room.totalCapacity || room.seats} beds available
                  </span>
                  {room.seats <= 0 && <span className="badge badge-full">Full</span>}
                  {bookingStatus[room._id] && (
                    <span className={`badge badge-${bookingStatus[room._id]}`}>
                      {bookingStatus[room._id]}
                    </span>
                  )}
                </div>
                {room.lifestyleTags?.length > 0 && (
                  <div className="tags">
                    {room.lifestyleTags.map((t) => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>
                )}
                <div className="actions">
                  <button
                    type="button"
                    className={`heart-btn ${shortlisted[room._id] ? 'active' : ''}`}
                    onClick={() => handleShortlist(room._id)}
                    disabled={savingShortlist}
                    title={shortlisted[room._id] ? 'Remove from shortlist' : 'Add to shortlist'}
                  >
                    {shortlisted[room._id] ? '♥' : '♡'}
                  </button>
                  {user?.id === room.owner?._id ? (
                    <button type="button" disabled>
                      🏠 Your room
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => navigate(`/chat/room/${room._id}`)}
                    >
                      💬 Chat
                    </button>
                  )}
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
            </FocalView>
          ))}
        </section>
      )}
    </div>
  );
}
