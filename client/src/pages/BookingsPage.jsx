import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

export default function BookingsPage() {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings');
      setRequests(res.data);
    } catch (err) {
      setMessage('Failed to load booking requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const updateRequest = async (id, status) => {
    setMessage(null);
    try {
      await api.patch(`/bookings/${id}`, { status });
      await loadRequests(); // Re-fetch all to sync room capacity counts
      setMessage(status === 'accepted' ? '✅ Booking accepted!' : 'Booking updated.');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage('Failed to update request');
    }
  };

  const userId = user?.id || user?._id;
  const isOwner = (req) => userId && String(req.owner?._id) === String(userId);

  // Filter out rejected and cancelled requests to keep the UI clean
  const visibleRequests = requests.filter(req => req.status === 'pending' || req.status === 'accepted');

  const StatusBadge = ({ status }) => (
    <span className={`badge badge-${status}`}>
      <span className="dot" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>📅 Booking Requests</h1>
      </div>

      {message && <div className={message.startsWith('❌') ? 'error' : 'info'}>{message}</div>}
      {loading && <div className="spinner-wrap"><div className="spinner" /></div>}

      {visibleRequests.length === 0 && !loading ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-state-icon">📅</span>
            <h3>No booking requests</h3>
            <p>
              {user?.role === 'owner'
                ? "No one has requested to book your rooms yet."
                : "You haven't requested any rooms. Browse and find your perfect place!"}
            </p>
            <div className="mt-4">
              {user?.role !== 'owner' && (
                <button className="btn" onClick={() => navigate('/browse')}>
                  🏠 Browse rooms
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 450px), 1fr))', gap: '2rem' }}>
          {visibleRequests.map((req) => (
            <article key={req._id} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
              {/* Premium Header Row */}
              <div className="booking-card-header">
                <div style={{ flex: 1 }}>
                  <div className="room-card-title" style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>
                    {req.room?.title || 'Unknown Room'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {req.room?.rent && <span className="rent-badge" style={{ padding: '0.35rem 0.75rem' }}>₹{req.room.rent.toLocaleString()}/mo</span>}
                    {req.room?.location && <span className="location-badge" style={{ padding: '0.35rem 0.75rem' }}>📍 {req.room.location}</span>}
                  </div>
                </div>
                <StatusBadge status={req.status} />
              </div>

              {/* Enhanced Participants Section */}
              <div className="booking-participants">
                <div className="booking-participant-row">
                  <span className="participant-label">Renter</span>
                  <div className="participant-info">
                    <span className="participant-name">{req.renter?.name || 'Guest User'}</span>
                    <span className="participant-email">{req.renter?.email}</span>
                    {req.room && typeof req.room.seats === 'number' && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: req.room.seats <= 0 ? 'var(--error)' : 'var(--success)', fontWeight: 600 }}>
                        {req.room.seats <= 0 ? '⚠️ No beds available' : `🛏️ ${req.room.seats} / ${req.room.totalCapacity || req.room.seats} beds free`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="booking-participant-row">
                  <span className="participant-label">Owner</span>
                  <div className="participant-info">
                    <span className="participant-name">{req.owner?.name || 'Loading...'}</span>
                    <span className="participant-email">{req.owner?.email}</span>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1 }} /> {/* Push actions to bottom */}

              {/* Refined Action Area */}
              <div className="actions" style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                {isOwner(req) && (
                  <>
                    {req.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          className="btn-success"
                          onClick={() => updateRequest(req._id, 'accepted')}
                          disabled={req.room?.seats <= 0}
                          style={{ padding: '0.75rem' }}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => updateRequest(req._id, 'rejected')}
                          style={{ padding: '0.75rem' }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {req.status === 'accepted' && (
                      <button
                        type="button"
                        className="btn-danger outline"
                        onClick={() => updateRequest(req._id, 'cancelled')}
                        style={{ padding: '0.75rem' }}
                      >
                        ❌ Remove Tenant
                      </button>
                    )}
                  </>
                )}
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => navigate(`/chat/room/${req.room?._id}`)}
                  style={{ padding: '0.75rem' }}
                >
                  💬 Chat
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
