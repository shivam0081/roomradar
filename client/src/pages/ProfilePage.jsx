import { useContext, useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

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
  const { updateUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  // Avatar upload
  const [avatarFile, setAvatarFile] = useState(null);   // local File for preview
  const [avatarPreview, setAvatarPreview] = useState(''); // object URL
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

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

  const toggleTag = (tagText) => {
    setForm((prev) => {
      const tags = prev.lifestyleTags || [];
      const index = tags.findIndex((t) => t.tag === tagText);

      if (index === -1) {
        // State 1: Add as Normal (weight 1)
        return { ...prev, lifestyleTags: [...tags, { tag: tagText, weight: 1, isMandatory: false }] };
      }

      const current = tags[index];
      const newTags = [...tags];

      if (current.weight === 1 && !current.isMandatory) {
        // State 2: Change to Important (weight 2)
        newTags[index] = { ...current, weight: 2 };
      } else if (current.weight === 2 && !current.isMandatory) {
        // State 3: Change to Mandatory (weight 3, mandatory)
        newTags[index] = { ...current, weight: 3, isMandatory: true };
      } else {
        // State 4: Remove
        newTags.splice(index, 1);
      }

      return { ...prev, lifestyleTags: newTags };
    });
  };

  const addCustomTag = () => {
    const tagText = tagInput.trim();
    if (!tagText) return;
    setForm((prev) => {
      const tags = prev.lifestyleTags || [];
      if (tags.some((t) => t.tag === tagText)) return prev;
      return {
        ...prev,
        lifestyleTags: [...tags, { tag: tagText, weight: 1, isMandatory: false }],
      };
    });
    setTagInput('');
  };

  const removeTag = (tagText) => {
    setForm((prev) => ({
      ...prev,
      lifestyleTags: (prev.lifestyleTags || []).filter((t) => t.tag !== tagText),
    }));
  };

  const [enhancingBio, setEnhancingBio] = useState(false);

  const enhanceBio = async () => {
    if (!form.bio) {
      setIsError(true);
      setMessage('Please write some rough notes in your Bio first so the AI can help rewrite it!');
      return;
    }
    setEnhancingBio(true);
    setMessage(null);
    try {
      const res = await api.post('/ai/enhance-description', {
        roughNotes: form.bio,
        type: 'bio'
      });
      if (res.data.enhancedText) {
        setForm(prev => ({ ...prev, bio: res.data.enhancedText }));
        setIsError(false);
        setMessage('✨ AI successfully enhanced your bio!');
      }
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || 'Failed to enhance bio.');
    } finally {
      setEnhancingBio(false);
    }
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return null;
    const data = new FormData();
    data.append('avatar', avatarFile);
    setUploadingAvatar(true);
    try {
      const res = await api.post('/upload/avatar', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.url;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      // Upload avatar first if a new one was selected
      let avatarUrl = form.avatar || '';
      if (avatarFile) {
        const uploaded = await uploadAvatar();
        if (uploaded) {
          avatarUrl = uploaded;
          setAvatarFile(null);
          setAvatarPreview('');
        }
      }

      // Remove immutable fields to prevent MongoDB errors
      const payload = { ...form, avatar: avatarUrl };
      delete payload._id;
      delete payload.__v;
      delete payload.role;
      delete payload.email;
      delete payload.createdAt;
      delete payload.updatedAt;

      const res = await api.put('/profile', payload);
      setProfile(res.data);
      setForm(res.data); // Sync form state with updated data (including new avatar URL)
      updateUser(res.data); // Update global AuthContext state so Navbar updates instantly
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
        {/* Avatar with upload overlay */}
        <div
          className="avatar-upload-wrapper"
          onClick={() => avatarInputRef.current?.click()}
          title="Change profile photo"
        >
          {avatarPreview || form.avatar ? (
            <img
              src={avatarPreview || form.avatar}
              alt="Profile avatar"
              className="avatar-img large"
            />
          ) : (
            <div className="avatar-circle large" style={{ width: '80px', height: '80px', fontSize: '2rem', flexShrink: 0 }}>
              {getInitials(form.name || profile.name)}
            </div>
          )}
          <div className="avatar-upload-overlay">
            {uploadingAvatar ? <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white' }} /> : '📷'}
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarSelect}
          />
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span>Public Bio</span>
                  <button 
                    type="button" 
                    onClick={enhanceBio} 
                    disabled={enhancingBio}
                    style={{
                      background: 'linear-gradient(45deg, #FF6B6B, #9B51E0)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '999px',
                      padding: '4px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      cursor: enhancingBio ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      opacity: enhancingBio ? 0.7 : 1,
                      boxShadow: '0 4px 12px rgba(155, 81, 224, 0.4)'
                    }}
                  >
                    {enhancingBio ? <div className="spinner" style={{ width: '12px', height: '12px', borderTopColor: 'white' }} /> : '✨'} 
                    {enhancingBio ? 'Enhancing...' : 'Enhance with AI'}
                  </button>
                </div>
                <textarea
                  name="bio"
                  rows="8"
                  placeholder="Tell potential roommates about yourself... Or just jot down bullet points and click Enhance with AI!"
                  value={form.bio || ''}
                  onChange={handleChange}
                  style={{ resize: 'vertical', minHeight: '160px' }}
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
                {LIFESTYLE_OPTIONS.map((tagText) => {
                  const tagObj = (form.lifestyleTags || []).find((t) => t.tag === tagText);
                  
                  let className = 'tag-interactive';
                  let prefix = '';
                  
                  if (tagObj) {
                    if (tagObj.isMandatory) {
                      className += ' active-mandatory';
                      prefix = '⚠️ ';
                    } else if (tagObj.weight === 2) {
                      className += ' active-important';
                      prefix = '⭐ ';
                    } else {
                      className += ' active';
                      prefix = '✦ ';
                    }
                  }

                  return (
                    <div
                      key={tagText}
                      className={className}
                      onClick={() => toggleTag(tagText)}
                      title={tagObj?.isMandatory ? 'Mandatory (Dealbreaker)' : tagObj?.weight === 2 ? 'Important' : tagObj ? 'Nice to have' : 'Click to select'}
                    >
                      {prefix}{tagText}
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
              {form.lifestyleTags?.some(t => !LIFESTYLE_OPTIONS.includes(t.tag)) && (
                <div style={{ marginTop: '1.25rem' }}>
                   <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>CUSTOM TAGS</div>
                   <div className="tag-cloud">
                     {form.lifestyleTags.filter(t => !LIFESTYLE_OPTIONS.includes(t.tag)).map(tagObj => {
                       let className = 'tag-interactive';
                       let prefix = '';
                       
                       if (tagObj.isMandatory) {
                         className += ' active-mandatory';
                         prefix = '⚠️ ';
                       } else if (tagObj.weight === 2) {
                         className += ' active-important';
                         prefix = '⭐ ';
                       } else {
                         className += ' active';
                         prefix = '✦ ';
                       }
                       
                       return (
                         <div
                           key={tagObj.tag}
                           className={className}
                           onClick={() => toggleTag(tagObj.tag)}
                           title={tagObj.isMandatory ? 'Mandatory (Dealbreaker)' : tagObj.weight === 2 ? 'Important' : 'Nice to have'}
                           style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                         >
                           {prefix}{tagObj.tag}
                           <button 
                             type="button" 
                             onClick={(e) => { e.stopPropagation(); removeTag(tagObj.tag); }} 
                             style={{ background: 'none', border: 'none', color: 'inherit', opacity: 0.7, fontSize: '1.2rem', cursor: 'pointer', padding: '0 0.2rem', marginLeft: '0.2rem' }}
                           >×</button>
                         </div>
                       );
                     })}
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
