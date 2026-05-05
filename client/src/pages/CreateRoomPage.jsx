import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const STORAGE_KEY = 'roomradar_create_room_draft';

const AMENITY_OPTIONS = [
  'WiFi', 'AC', 'Geyser', 'Washing machine', 'Parking', 'Power backup',
  'Water purifier', 'CCTV', 'Lift', 'Gym', 'Swimming pool', 'Security guard',
];

const TAG_OPTIONS = [
  'Clean', 'Study-friendly', 'Night owl OK', 'Early riser', 'Vegetarian preferred',
  'Non-smoker', 'Couples allowed', 'Students only', 'Working professionals',
  'Girls only', 'Boys only', 'Any',
];

export default function CreateRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    rent: '',
    availableFrom: '',
    totalCapacity: 1,
    amenities: [],
    lifestyleTags: [],
  });
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loadingRoom, setLoadingRoom] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      const fetchRoom = async () => {
        try {
          const res = await api.get(`/rooms/${id}`);
          const room = res.data;
          setForm({
            title: room.title || '',
            description: room.description || '',
            location: room.location || '',
            rent: room.rent || '',
            availableFrom: room.availableFrom ? new Date(room.availableFrom).toISOString().split('T')[0] : '',
            totalCapacity: room.totalCapacity || room.seats || 1,
            amenities: room.amenities || [],
            lifestyleTags: room.lifestyleTags || [],
          });
        } catch (err) {
          setIsError(true);
          setMessage('Failed to load room details.');
        } finally {
          setLoadingRoom(false);
        }
      };
      fetchRoom();
    } else {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try { setForm(JSON.parse(stored)); } catch { /* ignore */ }
      }
    }
  }, [id, isEdit]);

  useEffect(() => {
    if (!isEdit && !success) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    }
  }, [form, isEdit, success]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleAmenity = (item) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(item)
        ? prev.amenities.filter((a) => a !== item)
        : [...prev.amenities, item],
    }));
  };

  const toggleTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      lifestyleTags: prev.lifestyleTags.includes(tag)
        ? prev.lifestyleTags.filter((t) => t !== tag)
        : [...prev.lifestyleTags, tag],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const payload = {
        ...form,
        rent: Number(form.rent),
        totalCapacity: Number(form.totalCapacity),
        availableFrom: form.availableFrom ? new Date(form.availableFrom) : undefined,
      };

      if (isEdit) {
        await api.patch(`/rooms/${id}`, payload);
        setMessage('✅ Room updated successfully!');
        setTimeout(() => navigate('/my-rooms'), 1500);
      } else {
        await api.post('/rooms', payload);
        setSuccess(true);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} room. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  if (loadingRoom) {
    return (
      <div className="page">
        <div className="spinner-wrap"><div className="spinner" /></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="page">
        <div className="success-card">
          <span className="success-icon">🎉</span>
          <h2>Room Listed!</h2>
          <p>Your room has been successfully listed on RoomRadar. Renters can now find and contact you.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn"
              onClick={() => { setSuccess(false); setForm({ title: '', description: '', location: '', rent: '', availableFrom: '', totalCapacity: 1, amenities: [], lifestyleTags: [] }); }}
            >
              ➕ List another room
            </button>
            <button
              className="btn outline"
              onClick={() => navigate('/browse')}
            >
              🏠 Browse all rooms
            </button>
          </div>
        </div>
      </div>
    );
  }

  const chipStyle = (active) => ({
    padding: '0.3rem 0.7rem',
    borderRadius: '999px',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid',
    fontFamily: 'inherit',
    background: active ? 'var(--primary-light)' : 'rgba(255,255,255,0.04)',
    borderColor: active ? 'rgba(99,102,241,0.5)' : 'var(--border)',
    color: active ? 'var(--primary-2)' : 'var(--text-dim)',
    transition: 'all 160ms ease',
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isEdit ? '📝 Edit Room' : '➕ List a Room'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="section-label">🏠 Basic Information</div>
          <label>
            Room Title *
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Cozy 2BHK near Koramangala"
              required
            />
          </label>
          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe the room, neighbourhood, and what makes it special…"
            />
          </label>
          <label>
            Location *
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Koramangala, Bangalore"
              required
            />
          </label>
        </div>

        {/* Pricing & Availability */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="section-label">💰 Pricing & Availability</div>
          <div className="grid-2">
            <label>
              Monthly Rent (₹) *
              <input
                name="rent"
                type="number"
                min="0"
                value={form.rent}
                onChange={handleChange}
                placeholder="e.g. 15000"
                required
              />
            </label>
            <label>
              Total Capacity (Beds)
              <input
                name="totalCapacity"
                type="number"
                min={1}
                max={10}
                value={form.totalCapacity}
                onChange={handleChange}
                required
              />
            </label>
          </div>
          <label>
            Available From
            <input
              name="availableFrom"
              type="date"
              value={form.availableFrom}
              onChange={handleChange}
            />
          </label>
        </div>

        {/* Amenities */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="section-label">🛋️ Amenities</div>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.85rem' }}>Select all amenities available in your room:</p>
          <div className="tags">
            {AMENITY_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleAmenity(item)}
                style={chipStyle(form.amenities.includes(item))}
              >
                {form.amenities.includes(item) ? '✓ ' : ''}{item}
              </button>
            ))}
          </div>
          {form.amenities.length > 0 && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
              Selected: {form.amenities.join(' · ')}
            </div>
          )}
        </div>

        {/* Lifestyle Preferences */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-label">🏷️ Preferred Tenant Lifestyle</div>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.85rem' }}>
            These tags help the algorithm match your room with compatible tenants:
          </p>
          <div className="tags">
            {TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                style={chipStyle(form.lifestyleTags.includes(tag))}
              >
                {form.lifestyleTags.includes(tag) ? '✓ ' : ''}{tag}
              </button>
            ))}
          </div>
        </div>

        {message && <div className={isError ? 'error-msg' : 'success-msg'} style={{ marginBottom: '1rem' }}>{message}</div>}

        <button type="submit" className="form-submit-btn" disabled={saving}>
          {saving ? (isEdit ? 'Updating…' : 'Creating listing…') : (isEdit ? '💾 Save Changes' : '🚀 List Room')}
        </button>
      </form>
    </div>
  );
}
