import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * RoomGallery — Premium Fullscreen Lightbox with SVG icons
 */
export default function RoomGallery({ images, current, onClose, onNav }) {
  const total = images.length;

  const prev = useCallback(() => {
    onNav((current - 1 + total) % total);
  }, [current, total, onNav]);

  const next = useCallback(() => {
    onNav((current + 1) % total);
  }, [current, total, onNav]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [prev, next, onClose]);

  if (!images || images.length === 0) return null;

  return createPortal(
    <div className="gallery-backdrop" onClick={onClose}>
      <div className="gallery-stage" onClick={(e) => e.stopPropagation()}>

        <button className="gallery-btn gallery-close" onClick={onClose} aria-label="Close gallery">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="gallery-counter">
          {current + 1} / {total}
        </div>

        {total > 1 && (
          <button className="gallery-btn gallery-prev" onClick={prev} aria-label="Previous photo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        )}

        <img
          key={current}
          src={images[current]}
          alt={`Room photo ${current + 1}`}
          className="gallery-img"
        />

        {total > 1 && (
          <button className="gallery-btn gallery-next" onClick={next} aria-label="Next photo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        )}

        {total > 1 && (
          <div className="gallery-dots">
            {images.map((_, i) => (
              <button
                key={i}
                className={`gallery-dot ${i === current ? 'active' : ''}`}
                onClick={() => onNav(i)}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        )}

        {total > 1 && (
          <div className="gallery-thumbs">
            {images.map((url, i) => (
              <button
                key={i}
                className={`gallery-thumb ${i === current ? 'active' : ''}`}
                onClick={() => onNav(i)}
                aria-label={`Thumbnail ${i + 1}`}
              >
                <img src={url} alt={`Thumb ${i + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
