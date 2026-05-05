import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

/**
 * FocalView wraps an element to make it 'pop' or zoom in 
 * as it enters the center of the viewport during a scroll.
 */
export default function FocalView({ children, className = '' }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center", "end start"]
  });

  // Scale from 0.9 to 1.1 and back down to 0.9
  const scaleRaw = useTransform(scrollYProgress, [0, 0.5, 1], [0.93, 1.07, 0.93]);
  const opacityRaw = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], [0.5, 1, 1, 1, 0.5]);
  
  // Smooth the animation with a spring
  const scale = useSpring(scaleRaw, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const opacity = useSpring(opacityRaw, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      ref={ref}
      style={{ scale, opacity }}
      className={`focal-view-wrapper ${className}`}
    >
      {children}
    </motion.div>
  );
}
