import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Navigation.css';

export default function Navigation({ rooms, activeRoom, onNavigate, isTransitioning }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setScrolled(false);
  }, [activeRoom]);

  const currentRoom = rooms[activeRoom];

  return (
    <>
      {/* ——— Top Glass Pill Nav ——— */}
      <motion.nav
        className="nav-bar"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.76, 0, 0.24, 1] }}
        style={{
          '--room-accent': currentRoom.accent,
        }}
      >
        {/* Logo / Brand */}
        <div className="nav-brand">
          <span className="nav-house-icon">⌂</span>
          <span className="nav-brand-text serif italic">The House</span>
        </div>

        {/* Room tabs */}
        <div className="nav-rooms" role="navigation" aria-label="Room navigation">
          {rooms.map((room, i) => (
            <button
              key={room.id}
              id={`nav-${room.id}`}
              className={`nav-room-btn ${i === activeRoom ? 'active' : ''}`}
              onClick={() => onNavigate(i)}
              disabled={isTransitioning}
              aria-current={i === activeRoom ? 'page' : undefined}
              style={{ '--btn-accent': room.accent }}
            >
              <span className="nav-room-emoji">{room.emoji}</span>
              <span className="nav-room-label">{room.shortLabel}</span>
              {i === activeRoom && (
                <motion.div
                  className="nav-active-dot"
                  layoutId="nav-indicator"
                  transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          id="nav-hamburger"
        >
          <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
          <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
        </button>
      </motion.nav>

      {/* ——— Mobile Dropdown Menu ——— */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="nav-mobile-menu"
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.25 }}
          >
            {rooms.map((room, i) => (
              <button
                key={room.id}
                className={`nav-mobile-item ${i === activeRoom ? 'active' : ''}`}
                onClick={() => { onNavigate(i); setMenuOpen(false); }}
                style={{ '--btn-accent': room.accent }}
              >
                <span>{room.emoji}</span>
                <span>{room.label}</span>
                <span className="nav-mobile-tagline">{room.tagline}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ——— Room name watermark ——— */}
      <motion.div
        className="room-name-watermark"
        key={activeRoom}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.12, x: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        style={{ color: currentRoom.accent }}
      >
        {currentRoom.label}
      </motion.div>
    </>
  );
}
