import type { Address } from 'viem';
import { isAddress } from 'viem';
import { CHAIN_METADATA, isSupportedChainId, type SupportedChainId } from '@/constants/chains';
import { findTokenInCache } from '@/services/tokenListService';

/**
 * Native token sentinel used by 0x swap endpoints.
 */
export const NATIVE_TOKEN_SENTINEL = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

/**
 * Token definition used for symbol/address resolution and UI rendering.
 */
export interface TokenDescriptor {
  symbol: string;
  name: string;
  address: Address | typeof NATIVE_TOKEN_SENTINEL;
  decimals: number;
  isNative: boolean;
}

/**
 * Curated token map by supported chain.
 */
export const TOKENS_BY_CHAIN: Record<SupportedChainId, TokenDescriptor[]> = {
  1: [
    {
      symbol: 'ETH',
      name: 'Ether',
      address: NATIVE_TOKEN_SENTINEL,
      decimals: 18,
      isNative: true,
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      decimals: 18,
      isNative: false,
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
      isNative: false,
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6,
      isNative: false,
    },
    {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      decimals: 8,
      isNative: false,
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      decimals: 18,
      isNative: false,
    },
  ],
  8453: [
    {
      symbol: 'ETH',
      name: 'Ether',
      address: NATIVE_TOKEN_SENTINEL,
      decimals: 18,
      isNative: true,
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0x4200000000000000000000000000000000000006',
      decimals: 18,
      isNative: false,
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      decimals: 6,
      isNative: false,
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
      decimals: 6,
      isNative: false,
    },
    {
      symbol: 'cbBTC',
      name: 'Coinbase Wrapped BTC',
      address: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf',
      decimals: 8,
      isNative: false,
    },
  ],
  42161: [
    {
      symbol: 'ETH',
      name: 'Ether',
      address: NATIVE_TOKEN_SENTINEL,
      decimals: 18,
      isNative: true,
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      decimals: 18,
      isNative: false,
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      decimals: 6,
      isNative: false,
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xFd086bC7CD5C481DCC9C85ebe478A1C0b69FCbb9',
      decimals: 6,
      isNative: false,
    },
    {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
      decimals: 8,
      isNative: false,
    },
  ],
  10: [
    {
      symbol: 'ETH',
      name: 'Ether',
      address: NATIVE_TOKEN_SENTINEL,
      decimals: 18,
      isNative: true,
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0x4200000000000000000000000000000000000006',
      decimals: 18,
      isNative: false,
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      decimals: 6,
      isNative: false,
    },
  ],
  137: [
    {
      symbol: 'POL',
      name: 'Polygon',
      address: NATIVE_TOKEN_SENTINEL,
      decimals: 18,
      isNative: true,
    },
    {
      symbol: 'WPOL',
      name: 'Wrapped Polygon',
      address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      decimals: 18,
      isNative: false,
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
      decimals: 6,
      isNative: false,
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      decimals: 6,
      isNative: false,
    },
  ],
};

/**
 * Pinned symbols used in quick-select panel.
 */
export const PINNED_SYMBOLS = ['ETH', 'USDC', 'USDT', 'WBTC', 'DAI'] as const;

/**
 * Normalized resolution output used by pricing and transaction layers.
 */
export interface ResolvedToken {
  symbol: string;
  addressOrSymbol: string;
  decimals: number;
  isNative: boolean;
  name: string;
}

/**
 * Gets curated tokens for a chain.
 */
export function getTokensForChain(chainId: number): TokenDescriptor[] {
  if (!isSupportedChainId(chainId)) {
    return TOKENS_BY_CHAIN[8453];
  }

  return TOKENS_BY_CHAIN[chainId];
}

/**
 * Resolves a user token identifier (symbol or address) into a known token descriptor.
 */
export function resolveToken(chainId: number, token: string): ResolvedToken {
  if (!isSupportedChainId(chainId)) {
    throw new Error(`Unsupported chain id for token resolution: ${chainId}`);
  }

  const normalized = token.trim();

  if (isAddress(normalized)) {
    const known = TOKENS_BY_CHAIN[chainId].find(
      (entry) =>
        entry.address !== NATIVE_TOKEN_SENTINEL &&
        entry.address.toLowerCase() === normalized.toLowerCase(),
    );

    if (known) {
      return {
        symbol: known.symbol,
        addressOrSymbol: known.address,
        decimals: known.decimals,
        isNative: known.isNative,
        name: known.name,
      };
    }

    const fromCache = findTokenInCache(chainId, normalized);
    if (fromCache) {
      return {
        symbol: fromCache.symbol,
        addressOrSymbol: fromCache.isNative ? NATIVE_TOKEN_SENTINEL : fromCache.address,
        decimals: fromCache.decimals,
        isNative: fromCache.isNative ?? false,
        name: fromCache.name,
      };
    }

    return {
      symbol: `${normalized.slice(0, 6)}...${normalized.slice(-4)}`,
      addressOrSymbol: normalized,
      decimals: 18,
      isNative: false,
      name: 'Unknown Token',
    };
  }

  const upper = normalized.toUpperCase();
  const alias = upper === 'MATIC' ? 'POL' : upper;
  const known = TOKENS_BY_CHAIN[chainId].find((entry) => entry.symbol.toUpperCase() === alias);

  if (known) {
    return {
      symbol: known.symbol,
      addressOrSymbol: known.address,
      decimals: known.decimals,
      isNative: known.isNative,
      name: known.name,
    };
  }

  const fromCache = findTokenInCache(chainId, alias);
  if (fromCache) {
    return {
      symbol: fromCache.symbol,
      addressOrSymbol: fromCache.isNative ? NATIVE_TOKEN_SENTINEL : fromCache.address,
      decimals: fromCache.decimals,
      isNative: fromCache.isNative ?? false,
      name: fromCache.name,
    };
  }

  const chainName = CHAIN_METADATA[chainId].shortName;
  throw new Error(`Token ${token} is not in the ${chainName} token registry`);
}
