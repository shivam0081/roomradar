import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import LivingRoom from '../rooms/LivingRoom.jsx';
import Workspace from '../rooms/Workspace.jsx';
import Gallery from '../rooms/Gallery.jsx';
import ContactRoom from '../rooms/ContactRoom.jsx';
import './HouseContainer.css';

const ROOM_COMPONENTS = [LivingRoom, Workspace, Gallery, ContactRoom];

export default function HouseContainer({ rooms, activeRoom, onNavigate }) {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const prevRoomRef = useRef(activeRoom);

  useEffect(() => {
    if (!containerRef.current) return;

    const targetX = -(activeRoom * 100);
    const direction = activeRoom > prevRoomRef.current ? 1 : -1;

    // Cinematic camera pan with slight overshoot
    gsap.to(containerRef.current, {
      x: `${targetX}vw`,
      duration: 1.3,
      ease: 'power3.inOut',
    });

    // Subtle breathe zoom on the wrapper
    gsap.fromTo(wrapperRef.current,
      { scale: 1.015 },
      { scale: 1, duration: 1.4, ease: 'power2.out' }
    );

    prevRoomRef.current = activeRoom;
  }, [activeRoom]);

  return (
    <div className="house-wrapper" ref={wrapperRef}>
      {/* Vignette overlay */}
      <div className="house-vignette" />

      {/* Ambient color overlay that changes per room */}
      <motion.div
        className="room-ambient"
        key={activeRoom}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.0 }}
        style={{ background: rooms[activeRoom].bg }}
      />

      {/* The horizontal camera strip */}
      <div className="house-container" ref={containerRef}>
        {ROOM_COMPONENTS.map((RoomComponent, i) => (
          <div key={rooms[i].id} className="room-slot">
            <RoomComponent
              room={rooms[i]}
              isActive={i === activeRoom}
              onNavigate={onNavigate}
              roomIndex={i}
              totalRooms={rooms.length}
            />
          </div>
        ))}
      </div>

      {/* Edge navigation arrows */}
      <AnimatePresence>
        {activeRoom > 0 && (
          <motion.button
            className="edge-nav edge-nav--left"
            id="nav-prev-room"
            onClick={() => onNavigate(activeRoom - 1)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.4 }}
            aria-label={`Go to ${rooms[activeRoom - 1].label}`}
          >
            <span className="edge-nav-arrow">‹</span>
            <span className="edge-nav-label">{rooms[activeRoom - 1].emoji} {rooms[activeRoom - 1].shortLabel}</span>
          </motion.button>
        )}
        {activeRoom < rooms.length - 1 && (
          <motion.button
            className="edge-nav edge-nav--right"
            id="nav-next-room"
            onClick={() => onNavigate(activeRoom + 1)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.4 }}
            aria-label={`Go to ${rooms[activeRoom + 1].label}`}
          >
            <span className="edge-nav-label">{rooms[activeRoom + 1].emoji} {rooms[activeRoom + 1].shortLabel}</span>
            <span className="edge-nav-arrow">›</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
