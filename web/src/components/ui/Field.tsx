import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { DURATION, EASING } from '@/components/motion';

export type FieldState = 'default' | 'error' | 'success';

interface BaseFieldWrapperProps {
  id: string;
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  successText?: string;
  state?: FieldState;
  shakeKey?: number;
  children: ReactNode;
}

function getBorderStateClass(state: FieldState, disabled?: boolean): string {
  if (disabled) {
    return 'bg-cream-100 border-cream-200 text-ink-400 cursor-not-allowed';
  }
  if (state === 'error') {
    return 'bg-white border-danger-600 focus:border-danger-600 focus:ring-[3px] focus:ring-danger-600/15';
  }
  if (state === 'success') {
    return 'bg-white border-success-600 focus:border-success-600 focus:ring-[3px] focus:ring-success-600/15';
  }
  return 'bg-white border-cream-300 focus:border-maroon-700 focus:ring-[3px] focus:ring-maroon-700/15';
}

export function FieldWrapper({
  id,
  label,
  required,
  helperText,
  error,
  successText,
  state = 'default',
  shakeKey = 0,
  children,
}: BaseFieldWrapperProps) {
  const prefersReduced = useReducedMotion();
  const messageId = `${id}-msg`;
  const effectiveState: FieldState = error ? 'error' : state;

  return (
    <motion.div
      key={error && shakeKey > 0 && !prefersReduced ? `shake-${shakeKey}` : 'steady'}
      animate={
        error && shakeKey > 0 && !prefersReduced
          ? { x: [0, -4, 4, -2, 2, 0] }
          : { x: 0 }
      }
      transition={{ duration: DURATION.medium, ease: EASING.standard }}
      className="flex flex-col gap-1.5"
    >
      <label htmlFor={id} className="type-small leading-5 font-semibold text-ink-900">
        {label}
        {required && (
          <span className="ml-1 text-danger-600" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key="error"
            id={messageId}
            role="alert"
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.fast }}
            className="type-label leading-5 text-danger-600 break-words"
          >
            {error}
          </motion.p>
        ) : effectiveState === 'success' && successText ? (
          <motion.p
            key="success"
            id={messageId}
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.fast }}
            className="type-label leading-5 text-success-600 break-words"
          >
            {successText}
          </motion.p>
        ) : helperText ? (
          <p id={messageId} className="type-label leading-5 text-ink-600 break-words">
            {helperText}
          </p>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

export interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  successText?: string;
  state?: FieldState;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
  shakeKey?: number;
}

export const Field = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      id: providedId,
      label,
      required,
      helperText,
      error,
      successText,
      state = 'default',
      leftIcon,
      rightElement,
      shakeKey = 0,
      disabled,
      className = '',
      type = 'text',
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const [showPassword, setShowPassword] = useState(false);
    const prefersReduced = useReducedMotion();

    const isPassword = type === 'password';
    const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;
    const effectiveState: FieldState = error ? 'error' : state;
    const messageId = `${id}-msg`;
    const hasMessage = Boolean(error || (effectiveState === 'success' && successText) || helperText);

    return (
      <FieldWrapper
        id={id}
        label={label}
        required={required}
        helperText={helperText}
        error={error}
        successText={successText}
        state={effectiveState}
        shakeKey={shakeKey}
      >
        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className="pointer-events-none absolute left-3.5 flex items-center text-ink-600"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            type={resolvedType}
            disabled={disabled}
            aria-invalid={effectiveState === 'error'}
            aria-describedby={hasMessage ? messageId : undefined}
            className={[
              'min-h-11 md:min-h-[42px] w-full rounded-md border px-3.5 py-2 type-app-body text-ink-900 placeholder:text-ink-400 transition-colors focus:outline-none',
              leftIcon ? 'pl-10' : '',
              isPassword || rightElement ? 'pr-11' : '',
              getBorderStateClass(effectiveState, disabled),
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ transitionDuration: `${DURATION.fast * 1000}ms` }}
            {...props}
          />

          {isPassword ? (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              disabled={disabled}
              className="absolute right-0.5 flex h-11 w-11 md:h-10 md:w-10 items-center justify-center rounded-md text-ink-600 hover:text-maroon-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-700"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={showPassword ? 'hide' : 'show'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: prefersReduced ? 0 : DURATION.fast }}
                  className="flex items-center justify-center"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </motion.span>
              </AnimatePresence>
            </button>
          ) : (
            rightElement && <div className="absolute right-3 flex items-center">{rightElement}</div>
          )}
        </div>
      </FieldWrapper>
    );
  },
);

Field.displayName = 'Field';

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  successText?: string;
  state?: FieldState;
  leftIcon?: ReactNode;
  shakeKey?: number;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      id: providedId,
      label,
      required,
      helperText,
      error,
      successText,
      state = 'default',
      leftIcon,
      shakeKey = 0,
      disabled,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const effectiveState: FieldState = error ? 'error' : state;
    const messageId = `${id}-msg`;
    const hasMessage = Boolean(error || (effectiveState === 'success' && successText) || helperText);

    return (
      <FieldWrapper
        id={id}
        label={label}
        required={required}
        helperText={helperText}
        error={error}
        successText={successText}
        state={effectiveState}
        shakeKey={shakeKey}
      >
        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className="pointer-events-none absolute left-3.5 flex items-center text-ink-600"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}
          <select
            ref={ref}
            id={id}
            disabled={disabled}
            aria-invalid={effectiveState === 'error'}
            aria-describedby={hasMessage ? messageId : undefined}
            className={[
              'min-h-11 md:min-h-[42px] w-full appearance-none rounded-md border px-3.5 pr-10 py-2 type-app-body text-ink-900 transition-colors focus:outline-none',
              leftIcon ? 'pl-10' : '',
              getBorderStateClass(effectiveState, disabled),
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ transitionDuration: `${DURATION.fast * 1000}ms` }}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 h-4 w-4 text-ink-600"
            aria-hidden="true"
          />
        </div>
      </FieldWrapper>
    );
  },
);

SelectField.displayName = 'SelectField';

export interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  successText?: string;
  state?: FieldState;
  shakeKey?: number;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  (
    {
      id: providedId,
      label,
      required,
      helperText,
      error,
      successText,
      state = 'default',
      shakeKey = 0,
      disabled,
      className = '',
      rows = 3,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const effectiveState: FieldState = error ? 'error' : state;
    const messageId = `${id}-msg`;
    const hasMessage = Boolean(error || (effectiveState === 'success' && successText) || helperText);

    return (
      <FieldWrapper
        id={id}
        label={label}
        required={required}
        helperText={helperText}
        error={error}
        successText={successText}
        state={effectiveState}
        shakeKey={shakeKey}
      >
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          disabled={disabled}
          aria-invalid={effectiveState === 'error'}
          aria-describedby={hasMessage ? messageId : undefined}
          className={[
            'w-full rounded-md border px-3.5 py-2.5 type-app-body leading-6 text-ink-900 placeholder:text-ink-400 transition-colors focus:outline-none',
            getBorderStateClass(effectiveState, disabled),
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ transitionDuration: `${DURATION.fast * 1000}ms` }}
          {...props}
        />
      </FieldWrapper>
    );
  },
);

TextareaField.displayName = 'TextareaField';
