import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { EASING } from './tokens';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, y = 12, className }: RevealProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.18, delay: Math.min(delay, 0.08), ease: EASING.enter }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
