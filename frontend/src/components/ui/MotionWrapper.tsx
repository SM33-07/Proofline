'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface MotionFadeProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function MotionFade({ children, className = '', delay = 0 }: MotionFadeProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
