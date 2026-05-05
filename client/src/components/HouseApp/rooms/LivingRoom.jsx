import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import livingBg from '../assets/rooms/living.png';
import './rooms.css';

gsap.registerPlugin(ScrollTrigger);

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } },
  item: {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } },
  },
};

export default function LivingRoom({ room, isActive, onNavigate, roomIndex, totalRooms }) {
  const bgRef = useRef(null);
  const midRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Parallax on mouse move
  useEffect(() => {
    const handleMouse = (e) => {
      if (!isActive) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [isActive]);

  return (
    <div className="room room--living" id="room-living">
      {/* Background layer with parallax */}
      <motion.div
        className="room-bg"
        ref={bgRef}
        style={{
          backgroundImage: `url(${livingBg})`,
          x: mousePos.x * -18,
          y: mousePos.y * -10,
          scale: 1.08,
        }}
        animate={{ x: mousePos.x * -18, y: mousePos.y * -10 }}
        transition={{ type: 'spring', stiffness: 50, damping: 25 }}
      />

      {/* Warm light overlay */}
      <div className="room-light room-light--living" />

      {/* Midground floating elements */}
      <motion.div
        className="room-mid"
        ref={midRef}
        animate={{ x: mousePos.x * -8, y: mousePos.y * -5 }}
        transition={{ type: 'spring', stiffness: 60, damping: 28 }}
      >
        <div className="living-deco living-deco--plant" />
        <div className="living-deco living-deco--lamp" />
      </motion.div>

      {/* Content */}
      <div className="room-content">
        <motion.div
          className="room-tag"
          initial={{ opacity: 0, x: -20 }}
          animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <span className="tag-dot" style={{ background: room.accent }} />
          Welcome
        </motion.div>

        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate={isActive ? "visible" : "hidden"}
        >
          <motion.h1 variants={stagger.item} className="room-headline">
            Come on in,<br /><em>make yourself at home.</em>
          </motion.h1>
          <motion.p variants={stagger.item} className="room-body">
            This is a space where creativity meets comfort.<br />
            Explore each room to discover more about me.
          </motion.p>
          <motion.div variants={stagger.item} className="room-cta-row">
            <button
              className="cta-btn"
              id="living-explore-btn"
              onClick={() => onNavigate(1)}
              style={{ '--cta-color': room.accent }}
            >
              Explore the house
              <span className="cta-arrow">→</span>
            </button>
            <span className="cta-hint">or use the navigation above</span>
          </motion.div>
        </motion.div>

        {/* Floating cards */}
        <div className="living-cards">
          {['Designer', 'Developer', 'Creator'].map((tag, i) => (
            <motion.div
              key={tag}
              className="living-badge"
              initial={{ opacity: 0, y: 20, rotate: [-3, 2, -2][i] * 2 }}
              animate={isActive
                ? { opacity: 1, y: 0, rotate: [-3, 2, -2][i] }
                : { opacity: 0, y: 20, rotate: 0 }
              }
              transition={{ duration: 0.7, delay: 0.6 + i * 0.1 }}
              style={{ '--badge-accent': room.accent }}
            >
              {tag}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom scroll hint */}
      <motion.div
        className="scroll-hint"
        animate={isActive ? { opacity: [0.4, 0.9, 0.4] } : { opacity: 0 }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 1.5 }}
      >
        <div className="scroll-hint-line" style={{ background: room.accent }} />
        <span>Scroll or navigate →</span>
      </motion.div>
    </div>
  );
}
