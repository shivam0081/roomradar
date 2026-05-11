import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

export default function ShortlistPage() {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shortlist');
      setItems(res.data);
    } catch (err) {
      setMessage('Failed to load shortlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggle = async (type, itemId) => {
    try {
      await api.post('/shortlist', { type, itemId });
      load();
    } catch (err) {
      setMessage('Failed to update shortlist');
    }
  };

  const filtered = items.filter((e) => {
    if (activeTab === 'all') return true;
    return e.type === activeTab;
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1>❤️ Shortlist</h1>
      </div>
      {message && <div className="info">{message}</div>}

      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All ({items.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'room' ? 'active' : ''}`}
          onClick={() => setActiveTab('room')}
        >
          🏠 Rooms ({items.filter((i) => i.type === 'room').length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'user' ? 'active' : ''}`}
          onClick={() => setActiveTab('user')}
        >
          👤 People ({items.filter((i) => i.type === 'user').length})
        </button>
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-state-icon">💔</span>
            <h3>Your shortlist is empty</h3>
            <p>
              {activeTab === 'room'
                ? "You haven't saved any rooms yet. Browse rooms and tap ♡ to save them."
                : activeTab === 'user'
                  ? "You haven't saved any people yet."
                  : "Start exploring rooms and matches and save your favorites here."}
            </p>
            <div style={{ marginTop: '1rem' }}>
              <button className="btn" onClick={() => navigate('/browse')}>
                🏠 Browse rooms
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="cards">
          {filtered.map((entry) => {
            const item = entry.item;
            if (!item) return null;

            const isRoom = entry.type === 'room';
            return (
              <article key={entry._id} className="card">
                {isRoom ? (
                  <>
                    <div className="room-card-title">{item.title}</div>
                    {item.description && <p className="room-card-desc">{item.description}</p>}
                    <div className="room-card-meta">
                      {item.rent && <span className="rent-badge">₹{item.rent.toLocaleString()}/mo</span>}
                      {item.location && <span className="location-badge">📍 {item.location}</span>}
                      {item.seats !== undefined && (
                        <span className={`location-badge ${item.seats <= 0 ? 'text-error' : ''}`}>
                          🪑 {item.seats} / {item.totalCapacity || item.seats} beds
                        </span>
                      )}
                      {item.seats <= 0 && <span className="badge badge-full">Full</span>}
                    </div>
                    {item.lifestyleTags?.length > 0 && (
                      <div className="tags">
                        {item.lifestyleTags.map((t) => {
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
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.5rem' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary), #a78bfa)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '1.1rem', color: 'white', flexShrink: 0,
                    }}>
                      {item.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="room-card-title" style={{ marginBottom: '0.2rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{item.email}</div>
                    </div>
                  </div>
                )}
                <div className="actions">
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => handleToggle(entry.type, entry.itemId)}
                  >
                    🗑 Remove
                  </button>
                  <button
                    type="button"
                    disabled={entry.type === 'room' && item.owner && item.owner._id === user?.id}
                    onClick={() =>
                      navigate(entry.type === 'user' ? `/chat/user/${item._id}` : `/chat/room/${item._id}`)
                    }
                  >
                    {entry.type === 'room' && item.owner && item.owner._id === user?.id
                      ? '🏠 Your room'
                      : '💬 Chat'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
