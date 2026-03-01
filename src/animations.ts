import { useEffect, useMemo, useState } from 'react';
import {
  useMotionValueEvent,
  useSpring,
  type Transition,
  type Variant,
} from 'framer-motion';

/**
 * Shared spring transition presets for terminal interactions.
 */
export const springConfig: Record<'stiff' | 'gentle', Transition> = {
  stiff: { type: 'spring', stiffness: 420, damping: 36, mass: 0.7 },
  gentle: { type: 'spring', stiffness: 220, damping: 28, mass: 0.8 },
};

/**
 * Tab panel motion variants.
 */
export const tabPanelVariants: Record<'initial' | 'enter' | 'exit', Variant> = {
  initial: { opacity: 0, y: 4 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 0 },
};

/**
 * Button state spring scale.
 */
export const buttonStateVariants: Record<string, Variant> = {
  IDLE: { scale: 1, opacity: 1 },
  APPROVING: { scale: 0.99, opacity: 0.96 },
  SWAPPING: { scale: 0.99, opacity: 0.96 },
  SIGNING: { scale: 0.99, opacity: 0.96 },
  SUBMITTING: { scale: 0.99, opacity: 0.96 },
  SUCCESS: { scale: 1.01, opacity: 1 },
  ERROR: { scale: 1, opacity: 1 },
  CONFIRMED: { scale: 1.01, opacity: 1 },
  FAILED: { scale: 1, opacity: 1 },
};

/**
 * Animated count-up helper backed by framer-motion spring values.
 */
export function useCountUp(value: number, fractionDigits = 2): string {
  const spring = useSpring(0, springConfig.gentle);
  const [display, setDisplay] = useState(0);

  useMotionValueEvent(spring, 'change', (latest) => {
    setDisplay(latest);
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return useMemo(
    () =>
      display.toLocaleString('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }),
    [display, fractionDigits],
  );
}
