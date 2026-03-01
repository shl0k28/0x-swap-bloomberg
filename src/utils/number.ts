/**
 * Strips non-numeric characters from a decimal input.
 */
export function sanitizeDecimalInput(value: string): string {
  const sanitized = value.replace(/[^0-9.]/g, '');
  const [head, ...tail] = sanitized.split('.');
  if (tail.length === 0) {
    return head ?? '';
  }

  return `${head ?? ''}.${tail.join('')}`;
}

/**
 * Adds locale commas while preserving raw decimal string behavior.
 */
export function formatWithCommas(value: string): string {
  if (value.trim().length === 0) {
    return '';
  }

  const clean = sanitizeDecimalInput(value);
  const [intPart, fracPart] = clean.split('.');

  const formattedInt = Number(intPart || '0').toLocaleString('en-US');
  return fracPart !== undefined ? `${formattedInt}.${fracPart}` : formattedInt;
}

/**
 * Converts an absolute delta to signed percentage text.
 */
export function toSignedPercent(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}
