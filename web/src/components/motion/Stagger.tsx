import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { DURATION, EASING } from './tokens';

interface StaggerProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
  inView?: boolean;
}

export function Stagger({
  children,
  staggerDelay = 0.03,
  className,
  inView = true,
}: StaggerProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  const variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: Math.min(staggerDelay, 0.04),
      },
    },
  };

  if (inView) {
    return (
      <motion.div
        variants={variants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div variants={variants} initial="hidden" animate="visible" className={className}>
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  y?: number;
  duration?: number;
  className?: string;
}

export function StaggerItem({
  children,
  y = 10,
  duration = 0.16,
  className,
}: StaggerItemProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  const variants = {
    hidden: { opacity: 0, y },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: Math.min(duration, 0.18), ease: EASING.enter },
    },
  };

  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  );
}

export const STAGGER_FAST = DURATION.fast;
