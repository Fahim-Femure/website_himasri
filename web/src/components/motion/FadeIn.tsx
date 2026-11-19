import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { EASING } from './tokens';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.16,
  y = 8,
  className,
}: FadeInProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: Math.min(duration, 0.18), delay: Math.min(delay, 0.08), ease: EASING.enter }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
