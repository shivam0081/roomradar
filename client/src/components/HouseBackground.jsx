import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const getAlignStyles = (align) => {
  switch(align) {
    case 'top-left': return { top: '24px', right: '24px', transformOrigin: 'top right' };
    case 'bottom-right': return { bottom: '24px', left: '24px', transformOrigin: 'bottom left' };
    case 'bottom-left': return { bottom: '24px', right: '24px', transformOrigin: 'bottom right' };
    default: return { top: '24px', left: '24px', transformOrigin: 'top left' }; // top-right default
  }
};

const Hotspot = ({ top, left, label, text, align = 'top-right' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const alignStyle = getAlignStyles(align);

  return (
    <div 
      className="hotspot-container" 
      style={{ top, left, position: 'absolute' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="hotspot-pulse" />
      
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            className="hotspot-content"
            initial={{ opacity: 0, scale: 0.85, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.85, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ ...alignStyle, pointerEvents: 'none' }} 
          >
            <div className="hotspot-ornament"></div>
            <span className="hotspot-label">{label}</span>
            <p className="hotspot-text">{text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function HouseBackground() {
  const location = useLocation();
  const videoUrl = "/bg-video.mp4";

  return (
    <>
    <div className="house-background-container">
      <AnimatePresence mode="wait">
        <motion.div
          key="ambient-video"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.85, 0, 0.15, 1] }}
          className="house-bg-video-wrapper"
          style={{ width: '100%', height: '100%', position: 'absolute' }}
        >
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            style={{ 
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
              border: 'none', outline: 'none'
            }}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        </motion.div>
      </AnimatePresence>
    </div>

    {/* Interactive Background Elements (Hotspots) - Rendered as sibling to avoid z-index trap */}
    {['/', '/login', '/register'].includes(location.pathname) && (
      <div className="hotspots-layer" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998 }}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <Hotspot 
            top="18%" left="10%" 
            label="The Living Room" 
            text="Find the couch where you belong. Every great roommate conversation starts right here." 
            align="top-right"
          />
          <Hotspot 
            top="25%" left="88%" 
            label="Your Atmosphere" 
            text="A space curated for your peace. Atmospheric views and endless possibilities." 
            align="top-left"
          />
          <Hotspot 
            top="88%" left="15%" 
            label="Shared Moments" 
            text="More than just four walls. The perfect rental is shaped by the people you share it with." 
            align="bottom-right"
          />
        </div>
      </div>
    )}
    </>
  );
}
