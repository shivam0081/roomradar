import { useEffect, useState } from 'react';
import api from '../services/api';

const STORAGE_KEY = 'roomradar_profile_draft';

const LIFESTYLE_OPTIONS = [
  'Early riser', 'Night owl', 'Non-smoker', 'Smoker OK', 'Vegetarian',
  'Non-vegetarian', 'Pet-friendly', 'No pets', 'Study-friendly', 'Social',
  'Quiet', 'Clean', 'Gym-goer', 'Work-from-home', 'Organized', 'Friendly',
  'Responsible', 'WiFi needed', 'Couples OK', 'Students only',
];

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    api.get('/profile').then((res) => {
      setProfile(res.data);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try { 
          const parsed = JSON.parse(stored);
          // Only apply draft if it belongs to the current user OR we don't have an ID
          if (!parsed._id || parsed._id === res.data._id) {
            setForm(parsed); 
            return; 
          }
        } catch { /* ignore */ }
      }
      setForm(res.data);
    });
  }, []);

  useEffect(() => {
    if (!profile) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleTag = (tag) => {
    setForm((prev) => {
      const current = prev.lifestyleTags || [];
      return {
        ...prev,
        lifestyleTags: current.includes(tag)
          ? current.filter((t) => t !== tag)
          : [...current, tag],
      };
    });
  };

  const addCustomTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    setForm((prev) => ({
      ...prev,
      lifestyleTags: [...new Set([...(prev.lifestyleTags || []), tag])],
    }));
    setTagInput('');
  };

  const removeTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      lifestyleTags: (prev.lifestyleTags || []).filter((t) => t !== tag),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      // Remove immutable fields to prevent MongoDB errors
      const payload = { ...form };
      delete payload._id;
      delete payload.__v;
      delete payload.role;
      delete payload.email;
      delete payload.createdAt;
      delete payload.updatedAt;

      const res = await api.put('/profile', payload);
      setProfile(res.data);
      setIsError(false);
      setMessage('✅ Profile saved successfully!');
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      setIsError(true);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  if (!profile) return (
    <div className="page">
      <div className="spinner-wrap"><div className="spinner" /></div>
    </div>
  );

  return (
    <div className="page" style={{ maxWidth: '1000px' }}>
      {/* Enhanced Profile header */}
      <div className="profile-header card" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(0,0,0,0))' }}>
        <div className="avatar-circle large" style={{ width: '80px', height: '80px', fontSize: '2rem', flexShrink: 0 }}>
          {getInitials(form.name || profile.name)}
        </div>
        <div style={{ flex: 1 }}>
          <div className="profile-name" style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>{form.name || profile.name}</div>
          <div className="profile-badges" style={{ display: 'flex', gap: '0.75rem' }}>
            <span className="badge" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', background: 'var(--primary)', color: 'white', fontWeight: '900', borderRadius: '12px', boxShadow: '0 8px 20px var(--primary-glow)' }}>
              {profile.role === 'owner' ? '🏠 PROPERTY OWNER' : '🔍 ROOM HUNTER'}
            </span>
            {profile.isVerified && (
              <span className="badge-accepted" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', fontWeight: '900', borderRadius: '12px' }}>✅ VERIFIED RESIDENT</span>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="profile-grid">
          {/* Column 1: Basic & Bio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Basic Info */}
            <div className="card">
              <div className="section-label">👤 Basic Information</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="grid-2">
                  <label>
                    Full Name
                    <input name="name" value={form.name || ''} onChange={handleChange} placeholder="First & Last Name" />
                  </label>
                  <label>
                    Age
                    <input name="age" type="number" min="16" max="100" value={form.age || ''} onChange={handleChange} placeholder="e.g. 23" />
                  </label>
                </div>
                
                <label>
                  Email Address
                  <input name="email" type="email" value={form.email || ''} readOnly style={{ background: 'rgba(0,0,0,0.2)', opacity: 0.7 }} title="Email cannot be changed" />
                </label>

                <label>
                  Gender Identity
                  <div className="role-tabs" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                    {['male', 'female', 'other', 'prefer_not_to_say'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        className={`role-tab ${form.gender === g ? 'selected' : ''}`}
                        onClick={() => setForm((p) => ({ ...p, gender: g }))}
                      >
                        {g === 'male' ? '♂ Male' : g === 'female' ? '♀ Female' : g === 'other' ? '⚧ Other' : '🔒 Private'}
                      </button>
                    ))}
                  </div>
                </label>
              </div>
            </div>

            {/* Living Preferences */}
            <div className="card">
              <div className="section-label">🏠 Living Preferences</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <label>
                  Preferred Location
                  <input
                    placeholder="Area, City or Zip Code"
                    value={form.preferences?.location || ''}
                    onChange={(e) => setForm((prev) => ({
                      ...prev,
                      preferences: { ...prev.preferences, location: e.target.value },
                    }))}
                  />
                </label>
                
                <div className="grid-2">
                  <label>
                    Min Budget (₹)
                    <input
                      type="number"
                      placeholder="Min"
                      value={form.preferences?.budgetMin || ''}
                      onChange={(e) => setForm((prev) => ({
                        ...prev,
                        preferences: { ...prev.preferences, budgetMin: Number(e.target.value) },
                      }))}
                    />
                  </label>
                  <label>
                    Max Budget (₹)
                    <input
                      type="number"
                      placeholder="Max"
                      value={form.preferences?.budgetMax || ''}
                      onChange={(e) => setForm((prev) => ({
                        ...prev,
                        preferences: { ...prev.preferences, budgetMax: Number(e.target.value) },
                      }))}
                    />
                  </label>
                </div>

                <label>
                  Target Move-in Date
                  <input
                    type="date"
                    value={form.preferences?.moveInDate ? form.preferences.moveInDate.slice(0, 10) : ''}
                    onChange={(e) => setForm((prev) => ({
                      ...prev,
                      preferences: { ...prev.preferences, moveInDate: e.target.value },
                    }))}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Column 2: Lifestyle & Bio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Bio */}
            <div className="card">
              <div className="section-label">📝 About Me</div>
              <label>
                Public Bio
                <textarea
                  name="bio"
                  rows="5"
                  placeholder="Tell potential roommates about yourself, your habits, and what you're looking for..."
                  value={form.bio || ''}
                  onChange={handleChange}
                  style={{ resize: 'vertical', minHeight: '120px' }}
                />
              </label>
            </div>

            {/* Lifestyle Tags */}
            <div className="card">
              <div className="section-label">🏷️ Lifestyle & Habits</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1.25rem' }}>
                Tags help us find people with similar vibes. Select all that apply.
              </p>

              <div className="tag-cloud">
                {LIFESTYLE_OPTIONS.map((tag) => {
                  const active = (form.lifestyleTags || []).includes(tag);
                  return (
                    <div
                      key={tag}
                      className={`tag-interactive ${active ? 'active' : ''}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {active ? '✦ ' : ''}{tag}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Add Custom Trait
                </div>
                <div className="custom-tag-input-group" style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="e.g. Early Bird, Gamer..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={addCustomTag}
                    className="btn"
                    style={{ padding: '0 1rem', borderRadius: '8px', fontSize: '0.8rem' }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Display custom tags uniquely if they aren't in PRESET */}
              {form.lifestyleTags?.some(t => !LIFESTYLE_OPTIONS.includes(t)) && (
                <div style={{ marginTop: '1.25rem' }}>
                   <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>CUSTOM TAGS</div>
                   <div className="tag-cloud">
                     {form.lifestyleTags.filter(t => !LIFESTYLE_OPTIONS.includes(t)).map(tag => (
                       <span key={tag} className="tag" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                         {tag}
                         <button type="button" onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '1.1rem', cursor: 'pointer', padding: '0 0.2rem' }}>×</button>
                       </span>
                     ))}
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Messages & Submit */}
        <div style={{ marginTop: '2.5rem', position: 'sticky', bottom: '1.5rem', zIndex: 10 }}>
          {message && (
            <div className={isError ? 'error' : 'success-msg'} style={{ marginBottom: '1rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', border: '1px solid var(--primary)' }}>
              {message}
            </div>
          )}
          <button 
            type="submit" 
            className="form-submit-btn" 
            disabled={saving}
            style={{ height: '54px', fontSize: '1.1rem', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
          >
            {saving ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white' }} />
                Saving Profile...
              </>
            ) : (
              '✨ Update My Profile'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
