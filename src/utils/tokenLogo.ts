import { getAddress } from 'viem';
import { getNativeToken } from '@/constants/nativeTokens';
import { NATIVE_TOKEN_SENTINEL } from '@/constants/tokens';

const CHAIN_SLUG: Record<number, string> = {
  1: 'ethereum',
  8453: 'base',
  10: 'optimism',
  42161: 'arbitrum',
  137: 'polygon',
};

/**
 * Builds a Trust Wallet asset CDN logo URL for an address+chain pair.
 */
export function getTokenLogoUrl(address: string, chainId: number): string {
  const chain = CHAIN_SLUG[chainId] ?? 'ethereum';
  const normalizedAddress =
    address.toLowerCase() === NATIVE_TOKEN_SENTINEL.toLowerCase()
      ? getNativeToken(chainId).logoAddress
      : address;

  try {
    const checksummed = getAddress(normalizedAddress);
    return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chain}/assets/${checksummed}/logo.png`;
  } catch {
    return getFallbackLogo(address);
  }
}

/**
 * Generates a deterministic fallback SVG data URI for unavailable logos.
 */
export function getFallbackLogo(seed: string): string {
  const normalizedSeed = seed.trim().length > 0 ? seed.trim() : '??';
  const hue = [...normalizedSeed].reduce((accumulator, char) => accumulator + char.charCodeAt(0), 0) % 360;
  const label = normalizedSeed.slice(0, 2).toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><circle cx='16' cy='16' r='16' fill='hsl(${hue},60%,40%)'/><text x='50%' y='55%' text-anchor='middle' fill='white' font-size='13' font-family='monospace'>${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
