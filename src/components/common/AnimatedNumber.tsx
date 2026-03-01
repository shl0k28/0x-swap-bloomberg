import { useCountUp } from '@/animations';

/**
 * Animated numeric value that counts from zero on updates.
 */
export function AnimatedNumber({
  value,
  fractionDigits = 2,
}: {
  value: number;
  fractionDigits?: number;
}) {
  const formatted = useCountUp(value, fractionDigits);

  return <>{formatted}</>;
}
