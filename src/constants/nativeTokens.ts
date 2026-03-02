import { PYTH_PRICE_FEEDS } from '@/constants/pythFeeds';

export interface NativeToken {
  symbol: string;
  name: string;
  decimals: number;
  pythFeedId: string;
  coingeckoId: string;
  logoAddress: string;
}

export const NATIVE_TOKENS: Record<number, NativeToken> = {
  1: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    pythFeedId: PYTH_PRICE_FEEDS.ETH,
    coingeckoId: 'ethereum',
    logoAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  },
  8453: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    pythFeedId: PYTH_PRICE_FEEDS.ETH,
    coingeckoId: 'ethereum',
    logoAddress: '0x4200000000000000000000000000000000000006',
  },
  10: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    pythFeedId: PYTH_PRICE_FEEDS.ETH,
    coingeckoId: 'ethereum',
    logoAddress: '0x4200000000000000000000000000000000000006',
  },
  137: {
    symbol: 'POL',
    name: 'Polygon',
    decimals: 18,
    pythFeedId: PYTH_PRICE_FEEDS.POL,
    coingeckoId: 'matic-network',
    logoAddress: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  },
  42161: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    pythFeedId: PYTH_PRICE_FEEDS.ETH,
    coingeckoId: 'ethereum',
    logoAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  },
};

/**
 * Resolves native token metadata for the current chain.
 */
export function getNativeToken(chainId: number): NativeToken {
  const fallback = NATIVE_TOKENS[1];
  if (!fallback) {
    throw new Error('Native token config missing Ethereum fallback');
  }

  return NATIVE_TOKENS[chainId] ?? fallback;
}
