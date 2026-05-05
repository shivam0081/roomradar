import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const narrationMap = {
  '/': "Welcome to the common area! This is where our residents hang out, share meals, and build life-long friendships.",
  '/login': "Step into our entryway! Just a quick check before we show you the rest of the house.",
  '/register': "Joining the community? You're just a few steps away from finding your perfect flatmates.",
  '/browse': "Welcome to the Gallery! Take your time exploring each room—every one has its own unique vibe.",
  '/matches': "The Match Lounge! These are the folks who share your interests and lifestyle. Why not start a conversation?",
  '/shortlist': "Your favorite picks! This is your personal collection of rooms that caught your eye.",
  '/profile': "Your private corner! Keep your profile updated so like-minded flatmates can find you easily.",
  '/bookings': "The Management Desk. Here you can track your active resident requests and stay organized.",
  '/chat': "The Gossip Corner! Stay connected with your potential flatmates in real-time."
};

const OwnerGuide = () => {
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    const currentPath = Object.keys(narrationMap).find(p => location.pathname === p || (p !== '/' && location.pathname.startsWith(p)));
    if (currentPath) {
      setText(narrationMap[currentPath]);
      // Show guide shortly after room transition
      const timer = setTimeout(() => setShow(true), 1200);
      const hideTimer = setTimeout(() => setShow(false), 9000); // Auto-hide after 9s
      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
        setShow(false);
      };
    }
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9, x: '-50%' }}
          animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
          exit={{ opacity: 0, y: 20, scale: 0.9, x: '-50%' }}
          className="owner-guide-pill"
        >
          <div className="owner-avatar" style={{ fontSize: '1.5rem' }}>🏠</div>
          <div className="owner-text" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span className="owner-label" style={{ fontSize: '0.65rem', fontWeight: '900', color: 'var(--primary-2)', letterSpacing: '0.1em' }}>OWNER'S NOTE</span>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'white', fontWeight: '500', lineHeight: '1.3' }}>{text}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OwnerGuide;
