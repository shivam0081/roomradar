import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import galleryBg from '../assets/rooms/gallery.png';
import './rooms.css';

const artworks = [
  { id: 1, title: 'Golden Hour', medium: 'Digital Illustration', color: '#c8a060' },
  { id: 2, title: 'Solitude', medium: 'Photography', color: '#8b4f6a' },
  { id: 3, title: 'Urban Layers', medium: 'Mixed Media', color: '#4a6080' },
  { id: 4, title: 'Bloom', medium: 'Watercolour', color: '#c070a0' },
  { id: 5, title: 'Dusk', medium: 'Digital Art', color: '#6060b0' },
  { id: 6, title: 'Silence', medium: 'Photography', color: '#507870' },
];

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } },
  item: {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.65, ease: [0.76, 0, 0.24, 1] } },
  },
};

export default function Gallery({ room, isActive }) {
  const [selected, setSelected] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouse = (e) => {
      if (!isActive) return;
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [isActive]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="room room--gallery" id="room-gallery">
      <motion.div
        className="room-bg"
        style={{ backgroundImage: `url(${galleryBg})`, scale: 1.08 }}
        animate={{ x: mousePos.x * -12, y: mousePos.y * -7 }}
        transition={{ type: 'spring', stiffness: 50, damping: 25 }}
      />
      <div className="room-light room-light--gallery" />

      <div className="room-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="gallery-header"
        >
          <div className="room-tag">
            <span className="tag-dot" style={{ background: room.accent }} />
            Gallery
          </div>
          <h2>A collection<br /><em>of moments</em></h2>
          <p className="room-body">Click on a piece to explore it fully.</p>
        </motion.div>

        <motion.div
          className="gallery-grid"
          variants={stagger.container}
          initial="hidden"
          animate={isActive ? "visible" : "hidden"}
        >
          {artworks.map((art) => (
            <motion.button
              key={art.id}
              className="gallery-cell"
              id={`gallery-cell-${art.id}`}
              variants={stagger.item}
              whileHover={{ scale: 1.04, y: -4 }}
              onClick={() => setSelected(art)}
              style={{ '--cell-color': art.color }}
              aria-label={`Open ${art.title}`}
            >
              <div className="gallery-cell-inner">
                <div className="gallery-cell-art" style={{ background: `linear-gradient(135deg, ${art.color}44, ${art.color}22)` }}>
                  <div className="gallery-cell-shimmer" />
                  <span className="gallery-cell-num">0{art.id}</span>
                </div>
                <div className="gallery-cell-info">
                  <span className="gallery-cell-title">{art.title}</span>
                  <span className="gallery-cell-medium">{art.medium}</span>
                </div>
                <div className="gallery-cell-glow" />
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="gallery-lightbox"
            id="gallery-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="lightbox-content"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="lightbox-art" style={{ background: `linear-gradient(135deg, ${selected.color}66, ${selected.color}22)` }}>
                <span className="lightbox-art-num">0{selected.id}</span>
                <div className="lightbox-shimmer" />
              </div>
              <div className="lightbox-info">
                <h3>{selected.title}</h3>
                <p className="lightbox-medium">{selected.medium}</p>
                <p className="lightbox-desc">An exploration of form, light, and the quiet beauty found in ordinary moments. Each piece is a meditation on presence.</p>
              </div>
              <button className="lightbox-close" id="lightbox-close-btn" onClick={() => setSelected(null)} aria-label="Close lightbox">✕</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
