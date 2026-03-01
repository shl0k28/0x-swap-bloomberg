import { formatUnits } from 'viem';

/**
 * Formats integer amount strings using token decimals.
 */
export function formatTokenAmount(amount: string, decimals: number, fractionDigits = 6): string {
  const formatted = Number(formatUnits(BigInt(amount), decimals));
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(formatted);
}

/**
 * Formats bps values as percentages.
 */
export function formatBpsToPercent(bps: number | string): string {
  const value = typeof bps === 'string' ? Number(bps) : bps;
  return `${(value / 100).toFixed(2)}%`;
}

/**
 * Formats a large integer-like string with locale separators.
 */
export function formatIntegerString(raw: string): string {
  return BigInt(raw).toLocaleString('en-US');
}

/**
 * Formats unix timestamps as local readable time.
 */
export function formatTimestamp(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString();
}
