import { useEffect, useRef, useState } from 'react';
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
    images: [],
  });
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loadingRoom, setLoadingRoom] = useState(isEdit);
  // Image upload state
  const [imageFiles, setImageFiles] = useState([]);   // local File objects for preview
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [tagInput, setTagInput] = useState('');

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
            images: room.images || [],
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

  const toggleTag = (tagText) => {
    setForm((prev) => {
      const tags = prev.lifestyleTags || [];
      const index = tags.findIndex((t) => t.tag === tagText);

      if (index === -1) {
        return { ...prev, lifestyleTags: [...tags, { tag: tagText, weight: 1, isMandatory: false }] };
      }

      const current = tags[index];
      const newTags = [...tags];

      if (current.weight === 1 && !current.isMandatory) {
        newTags[index] = { ...current, weight: 2 };
      } else if (current.weight === 2 && !current.isMandatory) {
        newTags[index] = { ...current, weight: 3, isMandatory: true };
      } else {
        newTags.splice(index, 1);
      }

      return { ...prev, lifestyleTags: newTags };
    });
  };

  // Handle file selection — store locally for preview
  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    if (form.images.length + imageFiles.length + selected.length > 5) {
      setIsError(true);
      setMessage('You can upload a maximum of 5 images per room.');
      return;
    }
    setImageFiles((prev) => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Remove a local (not-yet-uploaded) preview image
  const removeLocalImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove an already-uploaded image (from form.images)
  const removeUploadedImage = (url) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((u) => u !== url) }));
  };

  // Upload all pending local files to Cloudinary via server
  const uploadPendingImages = async () => {
    if (imageFiles.length === 0) return [];
    const data = new FormData();
    imageFiles.forEach((f) => data.append('images', f));
    const res = await api.post('/upload/room-images', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.urls;
  };

  const [enhancingDesc, setEnhancingDesc] = useState(false);

  const enhanceDescription = async () => {
    if (!form.description && !form.title) {
      setIsError(true);
      setMessage('Please write at least a few words in the Description or Title first so the AI has something to work with.');
      return;
    }
    setEnhancingDesc(true);
    setMessage(null);
    try {
      const res = await api.post('/ai/enhance-description', {
        title: form.title,
        roughNotes: form.description,
        location: form.location,
        amenities: form.amenities,
        type: 'room'
      });
      if (res.data.enhancedText) {
        setForm(prev => ({ ...prev, description: res.data.enhancedText }));
        setIsError(false);
        setMessage('✨ AI successfully enhanced your room description!');
      }
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || 'Failed to enhance description.');
    } finally {
      setEnhancingDesc(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    setIsError(false);

    try {
      // Upload any pending local images first
      setUploading(true);
      let newUrls = [];
      try {
        newUrls = await uploadPendingImages();
      } finally {
        setUploading(false);
      }
      setImageFiles([]); // Clear local previews after successful upload

      const payload = {
        ...form,
        images: [...form.images, ...newUrls],
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span>Description</span>
              <button 
                type="button" 
                onClick={enhanceDescription} 
                disabled={enhancingDesc}
                style={{
                  background: 'linear-gradient(45deg, #FF6B6B, #9B51E0)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '4px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  cursor: enhancingDesc ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: enhancingDesc ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(155, 81, 224, 0.4)'
                }}
              >
                {enhancingDesc ? <div className="spinner" style={{ width: '12px', height: '12px', borderTopColor: 'white' }} /> : '✨'} 
                {enhancingDesc ? 'Enhancing...' : 'Enhance with AI'}
              </button>
            </div>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              placeholder="Jot down some rough bullet points (e.g., 'near metro, 2 beds, fast wifi') and click Enhance with AI..."
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
          <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>💰 Pricing & Availability</span>
          </div>
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
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="section-label">🏷️ Preferred Tenant Lifestyle</div>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.85rem' }}>
            These tags help the algorithm match your room with compatible tenants:
          </p>
          <div className="tags">
            {TAG_OPTIONS.map((tagText) => {
              const tagObj = (form.lifestyleTags || []).find((t) => t.tag === tagText);
              const active = !!tagObj;
              const isMandatory = tagObj?.isMandatory;
              const isImportant = tagObj?.weight === 2;

              let style = chipStyle(active);
              let prefix = active ? '✦ ' : '';
              if (isMandatory) {
                style = { ...style, background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.5)', color: '#fca5a5' };
                prefix = '⚠️ ';
              } else if (isImportant) {
                style = { ...style, background: 'rgba(245,183,84,0.1)', borderColor: 'rgba(245,183,84,0.5)', color: 'var(--primary)' };
                prefix = '⭐ ';
              }

              return (
                <button
                  key={tagText}
                  type="button"
                  onClick={() => toggleTag(tagText)}
                  style={style}
                  title={isMandatory ? 'Mandatory (Dealbreaker)' : isImportant ? 'Important' : active ? 'Nice to have' : 'Click to select'}
                >
                  {prefix}{tagText}
                </button>
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
                placeholder="e.g. Quiet, Gamer..."
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
          {form.lifestyleTags?.some(t => !TAG_OPTIONS.includes(t.tag)) && (
            <div style={{ marginTop: '1.25rem' }}>
               <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>CUSTOM TAGS</div>
               <div className="tags">
                 {form.lifestyleTags.filter(t => !TAG_OPTIONS.includes(t.tag)).map(tagObj => {
                   const active = true;
                   const isMandatory = tagObj.isMandatory;
                   const isImportant = tagObj.weight === 2;
     
                   let style = chipStyle(active);
                   let prefix = '✦ ';
                   if (isMandatory) {
                     style = { ...style, background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.5)', color: '#fca5a5' };
                     prefix = '⚠️ ';
                   } else if (isImportant) {
                     style = { ...style, background: 'rgba(245,183,84,0.1)', borderColor: 'rgba(245,183,84,0.5)', color: 'var(--primary)' };
                     prefix = '⭐ ';
                   }
     
                   return (
                     <div
                       key={tagObj.tag}
                       onClick={() => toggleTag(tagObj.tag)}
                       style={{ ...style, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                       title={isMandatory ? 'Mandatory (Dealbreaker)' : isImportant ? 'Important' : 'Nice to have'}
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

        {/* 📸 Room Photos */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-label">📸 Room Photos</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
            Upload up to 5 photos. First photo is the cover image shown on listings.
          </p>

          {/* Image preview grid */}
          {(form.images.length > 0 || imageFiles.length > 0) && (
            <div className="image-upload-grid">
              {/* Already uploaded images */}
              {form.images.map((url, i) => (
                <div key={url} className="image-upload-thumb">
                  <img src={url} alt={`Room photo ${i + 1}`} />
                  <button
                    type="button"
                    className="image-remove-btn"
                    onClick={() => removeUploadedImage(url)}
                    title="Remove photo"
                  >×</button>
                  {i === 0 && <span className="image-cover-badge">Cover</span>}
                </div>
              ))}
              {/* Local previews (not yet uploaded) */}
              {imageFiles.map((file, i) => (
                <div key={i} className="image-upload-thumb image-upload-thumb--pending">
                  <img src={URL.createObjectURL(file)} alt={`Preview ${i + 1}`} />
                  <button
                    type="button"
                    className="image-remove-btn"
                    onClick={() => removeLocalImage(i)}
                    title="Remove"
                  >×</button>
                  <span className="image-cover-badge" style={{ background: 'var(--warning)' }}>Pending</span>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          {form.images.length + imageFiles.length < 5 && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                id="room-image-input"
              />
              <label
                htmlFor="room-image-input"
                className="image-upload-dropzone"
              >
                <span style={{ fontSize: '2rem' }}>📷</span>
                <span style={{ fontWeight: 600 }}>Click to add photos</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  JPG, PNG, WebP · Max 8MB each · {5 - form.images.length - imageFiles.length} remaining
                </span>
              </label>
            </>
          )}

          {uploading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', color: 'var(--primary-2)' }}>
              <div className="spinner" style={{ width: '16px', height: '16px' }} />
              Uploading photos to cloud…
            </div>
          )}
        </div>

        {message && <div className={isError ? 'error-msg' : 'success-msg'} style={{ marginBottom: '1rem' }}>{message}</div>}

        <button type="submit" className="form-submit-btn" disabled={saving}>
          {saving ? (isEdit ? 'Updating…' : 'Creating listing…') : (isEdit ? '💾 Save Changes' : '🚀 List Room')}
        </button>
      </form>
    </div>
  );
}
