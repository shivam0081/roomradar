import React from 'react';
import { motion } from 'framer-motion';

/**
 * 3D Spatial Page Transition — "House Navigation"
 *
 * direction='forward'  → user walks INTO the next room (zoom through)
 * direction='backward' → user backs OUT of a room (zoom away)
 * direction='left'     → side-step left into an adjacent room (rotate + slide)
 * direction='right'    → side-step right into an adjacent room (rotate + slide)
 * direction='up'       → ascend (move up a level / deeper context)
 * direction='down'     → descend (return from deeper context)
 * direction='fade'     → soft cross-dissolve (same-level pages)
 */
const pageVariants = {
  initial: (direction) => {
    switch (direction) {
      case 'forward':
        return { scale: 0.25, opacity: 0, filter: 'blur(28px)', z: -800, rotateX: 8 };
      case 'backward':
        return { scale: 2.2, opacity: 0, filter: 'blur(28px)', z: 800, rotateX: -8 };
      case 'left':
        return { x: '90%', opacity: 0, rotateY: -45, scale: 0.75, z: -300 };
      case 'right':
        return { x: '-90%', opacity: 0, rotateY: 45, scale: 0.75, z: -300 };
      case 'up':
        return { y: '60%', opacity: 0, rotateX: -30, scale: 0.85, z: -200 };
      case 'down':
        return { y: '-60%', opacity: 0, rotateX: 30, scale: 0.85, z: -200 };
      default: // fade
        return { opacity: 0, scale: 0.94, filter: 'blur(8px)' };
    }
  },
  in: {
    x: 0, y: 0, z: 0,
    opacity: 1, scale: 1,
    filter: 'blur(0px)',
    rotateY: 0, rotateX: 0,
  },
  out: (direction) => {
    switch (direction) {
      case 'forward':
        return { scale: 5, opacity: 0, filter: 'blur(80px)', z: 1500, rotateX: -8 };
      case 'backward':
        return { scale: 0.2, opacity: 0, filter: 'blur(40px)', z: -1200, rotateX: 8 };
      case 'left':
        return { x: '-90%', opacity: 0, rotateY: 45, scale: 0.75, z: -300 };
      case 'right':
        return { x: '90%', opacity: 0, rotateY: -45, scale: 0.75, z: -300 };
      case 'up':
        return { y: '-60%', opacity: 0, rotateX: 30, scale: 0.85, z: -200 };
      case 'down':
        return { y: '60%', opacity: 0, rotateX: -30, scale: 0.85, z: -200 };
      default: // fade
        return { opacity: 0, scale: 1.06, filter: 'blur(8px)' };
    }
  },
};

const pageTransition = {
  duration: 0.78,
  ease: [0.76, 0, 0.24, 1], // cinematic ease-in-out
};

export default function PageTransition({ children, direction = 'fade', className = '' }) {
  return (
    /* Perspective container — THIS is what makes 3D transforms actually render in 3D */
    <div className="spatial-perspective-root">
      <motion.div
        custom={direction}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className={`page-transition-wrapper ${className}`}
        style={{ width: '100%', minHeight: '100vh', overflowX: 'hidden', transformStyle: 'preserve-3d' }}
      >
        {/* Flash overlay that fires on every transition */}
        <motion.div
          className="transition-flash-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: [0, 0.18, 0] }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
        />
        {children}
      </motion.div>
    </div>
  );
}
