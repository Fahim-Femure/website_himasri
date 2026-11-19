/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';

export const SIDEBAR_ACTIVE_SPRING = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 40,
};

interface NavItemProps {
  to: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  badgeCount?: number;
  onClick?: () => void;
}

export function NavItem({ to, label, icon, active, badgeCount, onClick }: NavItemProps) {
  const prefersReduced = useReducedMotion();

  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={[
        'relative flex min-h-[40px] items-center gap-3 rounded-md px-3.5 py-2 type-small leading-5 transition-colors duration-150',
        'focus-visible:outline-none',
        active
          ? 'text-white font-semibold'
          : 'text-cream-100/75 font-medium hover:bg-white/5 hover:text-white',
      ].join(' ')}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          aria-hidden="true"
          transition={prefersReduced ? { duration: 0 } : SIDEBAR_ACTIVE_SPRING}
          className="pointer-events-none absolute inset-0 rounded-md bg-white/10"
        >
          <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-gold-400" />
        </motion.span>
      )}
      <span
        className={[
          'relative z-10 flex items-center justify-center shrink-0 transition-colors duration-150 [&>svg]:h-[18px] [&>svg]:w-[18px]',
          active ? 'text-gold-400' : 'text-cream-100/65',
        ].join(' ')}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="relative z-10 truncate flex-1">{label}</span>
      {typeof badgeCount === 'number' && badgeCount > 0 && (
        <span
          aria-label={`${badgeCount} menunggu verifikasi`}
          className="relative z-10 inline-flex min-w-[20px] h-5 items-center justify-center rounded-full bg-gold-400 px-1.5 type-micro font-bold text-maroon-950 tabular-nums shrink-0"
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </Link>
  );
}
