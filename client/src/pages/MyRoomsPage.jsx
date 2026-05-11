import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import RoomGallery from '../components/RoomGallery';

export default function MyRoomsPage() {
  const { user } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();
  // Gallery state
  const [galleryRoom, setGalleryRoom] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rooms/my');
      setRooms(res.data);
    } catch {
      setIsError(true);
      setMessage('Failed to load your rooms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRooms(); }, []);

  const handleDelete = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this listing? This cannot be undone.')) return;
    setDeletingId(roomId);
    try {
      await api.delete(`/rooms/${roomId}`);
      setRooms((prev) => prev.filter((r) => r._id !== roomId));
      setIsError(false);
      setMessage('✅ Room deleted successfully.');
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setIsError(true);
      setMessage('Failed to delete room.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>🏠 My Listings</h1>
          {!loading && (
            <span className="rooms-count">
              {rooms.length} room{rooms.length !== 1 ? 's' : ''} listed
            </span>
          )}
        </div>
        <button className="btn" onClick={() => navigate('/create-room')}>
          ➕ List new room
        </button>
      </div>

      {message && <div className={isError ? 'error' : 'success-msg'}>{message}</div>}

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : rooms.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-state-icon">🏠</span>
            <h3>No listings yet</h3>
            <p>You haven't listed any rooms. Click below to create your first listing.</p>
            <div style={{ marginTop: '1rem' }}>
              <button className="btn" onClick={() => navigate('/create-room')}>
                ➕ List your first room
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="cards">
          {rooms.map((room) => (
            <article key={room._id} className="card room-card">
              {/* Cover Image */}
              {room.images?.length > 0 ? (
                <div
                  className="room-card-img-wrap"
                  onClick={() => { setGalleryRoom(room); setGalleryIndex(0); }}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={room.images[0]} alt={room.title} className="room-card-img" />
                  {room.images.length > 1 && (
                    <span className="room-card-view-photos">
                      🖼 {room.images.length} photos
                    </span>
                  )}
                </div>
              ) : (
                <div className="room-card-img-placeholder">
                  <span>🏠</span>
                </div>
              )}
              <div className="room-card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                <div className="room-card-title">{room.title}</div>
                <span className="rent-badge">₹{room.rent?.toLocaleString()}/mo</span>
              </div>

              {room.description && <p className="room-card-desc">{room.description}</p>}

              <div className="room-card-meta">
                {room.location && <span className="location-badge">📍 {room.location}</span>}
                <span className={`location-badge ${room.seats <= 0 ? 'badge-rejected' : ''}`} style={room.seats <= 0 ? {background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)'} : {}}>
                  {room.seats <= 0 ? '🚫 Full (0 seats)' : `🪑 ${room.seats} / ${room.totalCapacity || room.seats} beds remaining`}
                </span>
                {room.availableFrom && (
                  <span className="location-badge">
                    📅 From {new Date(room.availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>

              {room.amenities?.length > 0 && (
                <div className="tags" style={{ marginBottom: '0.5rem' }}>
                  {room.amenities.slice(0, 4).map((a) => (
                    <span key={a} className="tag" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)', color: '#6ee7b7' }}>
                      {a}
                    </span>
                  ))}
                  {room.amenities.length > 4 && (
                    <span className="tag">+{room.amenities.length - 4} more</span>
                  )}
                </div>
              )}

              {room.lifestyleTags?.length > 0 && (
                <div className="tags">
                  {room.lifestyleTags.map((t) => {
                    const tagText = typeof t === 'string' ? t : t.tag;
                    const isMandatory = t.isMandatory;
                    const isImportant = t.weight === 2;
                    let className = 'tag';
                    if (isMandatory) className += ' tag-mandatory';
                    else if (isImportant) className += ' tag-important';
                    return <span key={tagText} className={className}>{isMandatory ? '⚠️ ' : isImportant ? '⭐ ' : ''}{tagText}</span>;
                  })}
                </div>
              )}

              <div className="actions">
                <button
                  type="button"
                  onClick={() => navigate(`/chat/room/${room._id}`)}
                >
                  📥 View messages
                </button>
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => navigate(`/edit-room/${room._id}`)}
                >
                  📝 Edit Room
                </button>
                <button
                  type="button"
                  className="btn-danger outline"
                  onClick={() => handleDelete(room._id)}
                  disabled={deletingId === room._id}
                >
                  {deletingId === room._id ? 'Deleting…' : '🗑 Delete'}
                </button>
              </div>
            </div>
            </article>
          ))}
        </div>
      )}

      {/* Fullscreen Gallery */}
      {galleryRoom && (
        <RoomGallery
          images={galleryRoom.images}
          current={galleryIndex}
          onClose={() => setGalleryRoom(null)}
          onNav={setGalleryIndex}
        />
      )}
    </div>
  );
}
