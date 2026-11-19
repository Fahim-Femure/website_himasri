import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { DURATION } from '@/components/motion';

export type ButtonVariant =
  | 'primary'
  | 'gold'
  | 'secondary'
  | 'onDark'
  | 'outlineOnDark'
  | 'whatsapp'
  | 'danger'
  | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'lg' | 'md' | 'sm';
  pill?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  arrowRight?: boolean;
  fullWidth?: boolean;
}

export function WhatsAppGlyph({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.344 5l-1.406 5.156 5.281-1.391c1.469.797 3.109 1.219 4.75 1.219 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.813 14.125c-.25.703-1.438 1.344-1.984 1.422-.531.078-1.203.109-1.938-.125-.453-.141-1.031-.344-1.766-.656-3.094-1.328-5.109-4.469-5.266-4.672-.156-.203-1.25-1.672-1.25-3.188s.797-2.266 1.078-2.578c.281-.313.609-.391.813-.391.203 0 .406 0 .578.016.188.016.438-.078.688.531.25.609.859 2.094.938 2.25.078.156.125.344.031.547-.109.203-.156.328-.313.5-.156.172-.328.391-.469.531-.156.156-.313.328-.141.641.172.313.781 1.281 1.672 2.078 1.156 1.031 2.125 1.344 2.438 1.5.313.156.484.125.672-.078.188-.203.766-.891.969-1.203.203-.313.406-.266.688-.156.281.109 1.797.844 2.109 1 .313.156.516.234.594.359.078.125.078.734-.172 1.438z" />
    </svg>
  );
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-maroon-700 text-cream-50 hover:bg-maroon-800 border border-transparent',
  gold: 'bg-gold-400 text-maroon-950 hover:bg-gold-300 border border-transparent',
  secondary: 'bg-white text-ink-900 border border-cream-300 hover:bg-cream-100',
  onDark: 'bg-cream-50 text-maroon-900 hover:bg-white border border-transparent',
  outlineOnDark:
    'bg-transparent text-cream-50 border border-cream-200/80 hover:bg-white/10',
  whatsapp: 'bg-whatsapp-600 text-white hover:bg-whatsapp-700 border border-transparent',
  danger: 'bg-white text-danger-600 border border-danger-600/40 hover:bg-danger-50',
  ghost: 'bg-transparent text-ink-900 hover:bg-cream-100 border border-transparent',
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'min-h-11 md:min-h-[38px] px-3.5 md:px-3 py-2 md:py-1.5 type-small-medium',
  md: 'min-h-11 md:min-h-[40px] px-4 py-2 type-small-medium',
  lg: 'min-h-[48px] px-5 py-3 type-button',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      pill = false,
      loading = false,
      loadingLabel,
      leftIcon,
      rightIcon,
      arrowRight = false,
      fullWidth = false,
      disabled,
      className = '',
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const prefersReduced = useReducedMotion();
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={isDisabled}
        whileTap={isDisabled || prefersReduced ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.1 }}
        className={[
          'inline-flex items-center justify-center gap-2 font-semibold transition-all select-none cursor-pointer',
          pill ? 'rounded-full' : 'rounded-md',
          'focus-visible:outline-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          fullWidth ? 'w-full' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ transitionDuration: `${DURATION.fast * 1000}ms` }}
        {...(props as object)}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
        ) : variant === 'whatsapp' && !leftIcon ? (
          <WhatsAppGlyph className="h-4 w-4 shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>
        )}
        {children !== undefined && children !== null && children !== '' && (
          <span>{loading && loadingLabel ? loadingLabel : children}</span>
        )}
        {!loading && arrowRight && <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
        {!loading && !arrowRight && rightIcon && (
          <span className="shrink-0 flex items-center">{rightIcon}</span>
        )}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
