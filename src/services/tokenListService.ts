import { getAddress, isAddress } from 'viem';
import { getNativeToken } from '@/constants/nativeTokens';
import { logger } from '@/utils/logger';
import { getFallbackLogo, getTokenLogoUrl } from '@/utils/tokenLogo';

export interface TokenInfo {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  isNative?: boolean;
}

const CACHE_TTL_MS = 3_600_000;
const CACHE_PREFIX = 'tokenlist_v2_';
const NATIVE_TOKEN_SENTINEL = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

// Only canonical protocol/chain-maintained token lists.
const TOKEN_LIST_SOURCES: Record<number, string[]> = {
  1: [
    'https://tokens.uniswap.org',
    'https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json',
    'https://tokenlist.aave.eth.limo',
  ],
  137: [
    'https://tokens.uniswap.org',
    'https://raw.githubusercontent.com/QuikNode-Labs/token-list/main/tokenlist.json',
    'https://raw.githubusercontent.com/sushiswap/list/master/lists/token-lists/default-token-list/tokens/polygon.json',
  ],
  10: [
    'https://tokens.uniswap.org',
    'https://raw.githubusercontent.com/ethereum-optimism/ethereum-optimism.github.io/master/optimism.tokenlist.json',
    'https://raw.githubusercontent.com/velodrome-finance/tokenlist/main/list.json',
  ],
  42161: [
    'https://tokens.uniswap.org',
    'https://bridge.arbitrum.io/token-list-42161.json',
    'https://raw.githubusercontent.com/CamelotLabs/token-list/main/camelot.tokenlist.json',
  ],
  8453: [
    'https://tokens.uniswap.org',
    'https://raw.githubusercontent.com/ethereum-optimism/ethereum-optimism.github.io/master/optimism.tokenlist.json',
    'https://raw.githubusercontent.com/aerodrome-finance/tokenlist/main/list.json',
  ],
};

interface CachedChainTokens {
  fetchedAt: number;
  tokens: TokenInfo[];
}

let memoryCache: Record<number, CachedChainTokens> = {};
const inflight = new Map<number, Promise<TokenInfo[]>>();

/**
 * Fetches chain-specific token list with resilient multi-source merge.
 */
export async function fetchTokenListForChain(chainId: number): Promise<TokenInfo[]> {
  const targetChainId = Number(chainId);
  const cacheKey = `${CACHE_PREFIX}${targetChainId}`;

  const memory = memoryCache[targetChainId];
  if (memory && Date.now() - memory.fetchedAt < CACHE_TTL_MS) {
    return memory.tokens;
  }

  const storage = getStorage();
  if (storage) {
    try {
      const cachedRaw = storage.getItem(cacheKey);
      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw) as unknown;
        const cached = parseCachedEntry(parsed);
        if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
          memoryCache[targetChainId] = cached;
          return cached.tokens;
        }
      }
    } catch {
      // Corrupt cache should not break runtime.
    }
  }

  const pending = inflight.get(targetChainId);
  if (pending) {
    return pending;
  }

  const task = (async () => {
    const sources = TOKEN_LIST_SOURCES[targetChainId] ?? TOKEN_LIST_SOURCES[1] ?? [];

    const results = await Promise.allSettled(
      sources.map(async (url) => {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as unknown;
        const raw = extractRawTokens(data);
        return raw
          .map((candidate) => normalizeToken(candidate, targetChainId))
          .filter((token): token is TokenInfo => token !== null);
      }),
    );

    const allTokens: TokenInfo[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allTokens.push(...result.value);
        return;
      }

      if (import.meta.env.DEV) {
        logger.warn('token_list_source_failed', {
          chainId: targetChainId,
          url: sources[index],
          reason: result.reason instanceof Error ? result.reason.message : 'unknown',
        });
      }
    });

    const deduped = dedupeTokens(allTokens);
    const resolved = deduped.length === 0 ? getHardcodedFallback(targetChainId) : sortWithNativeFirst(deduped, targetChainId);

    const payload: CachedChainTokens = {
      tokens: resolved,
      fetchedAt: Date.now(),
    };

    memoryCache[targetChainId] = payload;

    if (storage) {
      try {
        storage.setItem(cacheKey, JSON.stringify(payload));
      } catch {
        // localStorage full/unavailable, continue without cache write.
      }
    }

    return resolved;
  })();

  inflight.set(targetChainId, task);

  try {
    return await task;
  } finally {
    inflight.delete(targetChainId);
  }
}

/**
 * Reads cached list for a chain if present and not expired.
 */
export function getCachedTokenListForChain(chainId: number): TokenInfo[] | null {
  const targetChainId = Number(chainId);
  const memory = memoryCache[targetChainId];
  if (memory && Date.now() - memory.fetchedAt < CACHE_TTL_MS) {
    return memory.tokens;
  }

  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const cachedRaw = storage.getItem(`${CACHE_PREFIX}${targetChainId}`);
    if (!cachedRaw) {
      return null;
    }

    const parsed = JSON.parse(cachedRaw) as unknown;
    const cached = parseCachedEntry(parsed);
    if (!cached || Date.now() - cached.fetchedAt >= CACHE_TTL_MS) {
      return null;
    }

    memoryCache[targetChainId] = cached;
    return cached.tokens;
  } catch {
    return null;
  }
}

/**
 * Finds a token entry by symbol or address in cached chain list.
 */
export function findTokenInCache(chainId: number, token: string): TokenInfo | undefined {
  const tokens = getCachedTokenListForChain(chainId);
  if (!tokens) {
    return undefined;
  }

  const normalized = token.trim();
  if (normalized.length === 0) {
    return undefined;
  }

  if (isAddress(normalized)) {
    return tokens.find((entry) => entry.address.toLowerCase() === normalized.toLowerCase());
  }

  const symbol = normalized.toUpperCase();
  return tokens.find((entry) => entry.symbol.toUpperCase() === symbol);
}

/**
 * Resolves logo URI with TrustWallet-first strategy and deterministic fallback.
 */
export function resolveLogoURI(token: TokenInfo, chainId: number): string {
  if (!token.address) {
    return getFallbackLogo(token.symbol);
  }

  if (isAddress(token.address)) {
    return getTokenLogoUrl(token.address, chainId);
  }

  if (token.logoURI && token.logoURI.startsWith('https://')) {
    return token.logoURI;
  }

  return getFallbackLogo(token.symbol);
}

function sortWithNativeFirst(tokens: TokenInfo[], chainId: number): TokenInfo[] {
  const normalized = ensureNativeTokenEntry(tokens, chainId);
  const nativeEntries = normalized.filter(
    (token) =>
      token.isNative === true ||
      token.address.toLowerCase() === NATIVE_TOKEN_SENTINEL.toLowerCase(),
  );
  const nonNativeEntries = normalized
    .filter((token) => !nativeEntries.includes(token))
    .sort((left, right) => left.symbol.localeCompare(right.symbol));

  return [...nativeEntries, ...nonNativeEntries];
}

function ensureNativeTokenEntry(tokens: TokenInfo[], chainId: number): TokenInfo[] {
  const native = getNativeToken(chainId);
  const hasNative = tokens.some(
    (token) =>
      token.isNative === true ||
      token.address.toLowerCase() === NATIVE_TOKEN_SENTINEL.toLowerCase(),
  );

  const normalized = tokens.map((token) =>
    token.address.toLowerCase() === NATIVE_TOKEN_SENTINEL.toLowerCase()
      ? { ...token, isNative: true }
      : token,
  );

  if (hasNative) {
    return normalized;
  }

  return [
    {
      chainId,
      address: NATIVE_TOKEN_SENTINEL,
      symbol: native.symbol,
      name: native.name,
      decimals: native.decimals,
      isNative: true,
    },
    ...normalized,
  ];
}

function dedupeTokens(tokens: TokenInfo[]): TokenInfo[] {
  const seen = new Set<string>();
  const deduped: TokenInfo[] = [];

  for (const token of tokens) {
    if (!token.address) {
      continue;
    }

    const key = `${token.address.toLowerCase()}_${token.chainId}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(token);
  }

  return deduped;
}

function extractRawTokens(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object') {
    const maybeTokens = (data as Record<string, unknown>)['tokens'];
    if (Array.isArray(maybeTokens)) {
      return maybeTokens;
    }
  }

  return [];
}

function normalizeToken(candidate: unknown, chainId: number): TokenInfo | null {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const raw = candidate as Record<string, unknown>;
  if (Number(raw['chainId']) !== Number(chainId)) {
    return null;
  }

  const address = raw['address'];
  const symbol = raw['symbol'];
  const name = raw['name'];
  const decimals = Number(raw['decimals']);
  const logoURI = raw['logoURI'];

  if (typeof address !== 'string' || !isAddress(address)) {
    return null;
  }

  if (typeof symbol !== 'string' || symbol.trim().length === 0) {
    return null;
  }

  if (typeof name !== 'string' || name.trim().length === 0) {
    return null;
  }

  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
    return null;
  }

  return {
    chainId,
    address: getAddress(address),
    symbol: symbol.trim(),
    name: name.trim(),
    decimals,
    logoURI: typeof logoURI === 'string' ? logoURI : undefined,
    isNative: false,
  };
}

function parseCachedEntry(value: unknown): CachedChainTokens | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const root = value as Record<string, unknown>;
  const fetchedAt = root['fetchedAt'];
  const tokens = root['tokens'];

  if (typeof fetchedAt !== 'number' || !Array.isArray(tokens)) {
    return null;
  }

  const parsedTokens = tokens
    .map((token) => parseCachedToken(token))
    .filter((token): token is TokenInfo => token !== null);

  return {
    fetchedAt,
    tokens: parsedTokens,
  };
}

function parseCachedToken(value: unknown): TokenInfo | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const token = value as Record<string, unknown>;
  const chainId = Number(token['chainId']);
  const address = token['address'];
  const symbol = token['symbol'];
  const name = token['name'];
  const decimals = Number(token['decimals']);
  const logoURI = token['logoURI'];
  const isNative = token['isNative'];

  if (!Number.isInteger(chainId)) {
    return null;
  }

  if (typeof address !== 'string' || typeof symbol !== 'string' || typeof name !== 'string') {
    return null;
  }

  if (!Number.isInteger(decimals)) {
    return null;
  }

  return {
    chainId,
    address,
    symbol,
    name,
    decimals,
    logoURI: typeof logoURI === 'string' ? logoURI : undefined,
    isNative: typeof isNative === 'boolean' ? isNative : undefined,
  };
}

function getHardcodedFallback(chainId: number): TokenInfo[] {
  const FALLBACKS: Record<number, TokenInfo[]> = {
    1: [
      { chainId: 1, address: NATIVE_TOKEN_SENTINEL, symbol: 'ETH', name: 'Ethereum', decimals: 18 },
      { chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      { chainId: 1, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
      { chainId: 1, address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', name: 'Dai', decimals: 18 },
      { chainId: 1, address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8 },
    ],
    137: [
      { chainId: 137, address: NATIVE_TOKEN_SENTINEL, symbol: 'POL', name: 'Polygon', decimals: 18 },
      { chainId: 137, address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      { chainId: 137, address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
      { chainId: 137, address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', symbol: 'DAI', name: 'Dai', decimals: 18 },
    ],
    10: [
      { chainId: 10, address: NATIVE_TOKEN_SENTINEL, symbol: 'ETH', name: 'Ethereum', decimals: 18 },
      { chainId: 10, address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      { chainId: 10, address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
      { chainId: 10, address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI', name: 'Dai', decimals: 18 },
    ],
    42161: [
      { chainId: 42161, address: NATIVE_TOKEN_SENTINEL, symbol: 'ETH', name: 'Ethereum', decimals: 18 },
      { chainId: 42161, address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      { chainId: 42161, address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
      { chainId: 42161, address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI', name: 'Dai', decimals: 18 },
    ],
    8453: [
      { chainId: 8453, address: NATIVE_TOKEN_SENTINEL, symbol: 'ETH', name: 'Ethereum', decimals: 18 },
      { chainId: 8453, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      { chainId: 8453, address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', symbol: 'DAI', name: 'Dai', decimals: 18 },
    ],
  };

  const nativeSymbol = getNativeToken(chainId).symbol;
  const fallback = FALLBACKS[chainId] ?? FALLBACKS[1] ?? [];
  const native = fallback.filter((token) => token.symbol === nativeSymbol);
  const rest = fallback.filter((token) => token.symbol !== nativeSymbol);
  return [...native, ...rest];
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
