export const DURATION = {
  fast: 0.15,
  base: 0.2,
  medium: 0.3,
  slow: 0.5,
  hero: 0.6,
} as const;

export const EASING = {
  enter: [0.16, 1, 0.3, 1] as const,
  exit: [0.7, 0, 0.84, 0] as const,
  standard: [0.4, 0, 0.2, 1] as const,
};

export const SPRING = {
  toggle: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 30,
  },
  chip: {
    duration: 0.25,
    ease: EASING.enter,
  },
};

export const REDUCED_TRANSITION = {
  duration: DURATION.fast,
  ease: 'linear' as const,
};
