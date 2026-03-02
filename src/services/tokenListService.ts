import { getAddress, isAddress } from 'viem';
import { NATIVE_TOKENS, getNativeToken } from '@/constants/nativeTokens';
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

export interface TokenListCache {
  tokens: TokenInfo[];
  fetchedAt: number;
  byChain: Record<number, TokenInfo[]>;
  byAddress: Record<string, TokenInfo>;
}

const CACHE_KEY = 'matcha-ai-token-list-cache-v1';
export const CACHE_TTL_MS = 1000 * 60 * 60;
const UNISWAP_LIST_URL = 'https://tokens.uniswap.org';
const COINGECKO_LIST_URL = 'https://tokens.coingecko.com/uniswap/all.json';
const NATIVE_TOKEN_SENTINEL = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

const SUPPORTED_CHAIN_IDS = Object.keys(NATIVE_TOKENS)
  .map((id) => Number(id))
  .filter((id) => Number.isInteger(id));

let memoryCache: TokenListCache | null = null;
let inflightFetch: Promise<TokenListCache> | null = null;

interface TokenListPayload {
  tokens: Array<{
    chainId: number;
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
  }>;
}

/**
 * Fetches and caches token lists with Uniswap-primary and CoinGecko fallback.
 */
export async function fetchTokenList(): Promise<TokenListCache> {
  const cached = getCachedTokenList();
  if (cached) {
    return cached;
  }

  if (inflightFetch) {
    return inflightFetch;
  }

  inflightFetch = (async () => {
    const tokens = await fetchRemoteTokenList();
    const cache = buildCache(tokens, Date.now());
    memoryCache = cache;
    persistCache(cache);
    return cache;
  })();

  try {
    return await inflightFetch;
  } finally {
    inflightFetch = null;
  }
}

/**
 * Gets cached token list if present and fresh.
 */
export function getCachedTokenList(): TokenListCache | null {
  if (memoryCache && Date.now() - memoryCache.fetchedAt < CACHE_TTL_MS) {
    return memoryCache;
  }

  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const cache = validateCachedPayload(parsed);
    if (!cache) {
      return null;
    }

    if (Date.now() - cache.fetchedAt >= CACHE_TTL_MS) {
      return null;
    }

    memoryCache = cache;
    return cache;
  } catch {
    return null;
  }
}

/**
 * Returns chain-filtered token list from a cache payload.
 */
export function getTokensForChain(cache: TokenListCache, chainId: number): TokenInfo[] {
  return cache.byChain[chainId] ?? [];
}

/**
 * Resolves a best-effort token entry from cache by symbol or address.
 */
export function findTokenInCache(chainId: number, token: string): TokenInfo | undefined {
  const cache = getCachedTokenList();
  if (!cache) {
    return undefined;
  }

  const trimmed = token.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  if (isAddress(trimmed)) {
    const normalized = trimmed.toLowerCase();
    return cache.byAddress[`${chainId}:${normalized}`] ?? cache.byAddress[normalized];
  }

  const upper = trimmed.toUpperCase();
  return (cache.byChain[chainId] ?? []).find((entry) => entry.symbol.toUpperCase() === upper);
}

/**
 * Resolves token logo source using Trust Wallet first, then token list, then fallback.
 */
export function resolveLogoURI(token: TokenInfo, chainId: number): string {
  if (!token.address) {
    return getFallbackLogo(token.symbol);
  }

  const trustWalletLogo = getTokenLogoUrl(token.address, chainId);
  if (token.logoURI && token.logoURI.startsWith('https://')) {
    return trustWalletLogo;
  }

  return trustWalletLogo;
}

async function fetchRemoteTokenList(): Promise<TokenInfo[]> {
  try {
    const primary = await fetchTokenListFrom(UNISWAP_LIST_URL);
    return normalizeTokens(primary.tokens);
  } catch {
    const fallback = await fetchTokenListFrom(COINGECKO_LIST_URL);
    return normalizeTokens(fallback.tokens);
  }
}

async function fetchTokenListFrom(url: string): Promise<TokenListPayload> {
  const response = await fetch(url, { method: 'GET', cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Token list fetch failed: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (!isTokenListPayload(payload)) {
    throw new Error('Token list payload malformed');
  }

  return payload;
}

function buildCache(tokens: TokenInfo[], fetchedAt: number): TokenListCache {
  const byChain: Record<number, TokenInfo[]> = {};
  const byAddress: Record<string, TokenInfo> = {};

  for (const chainId of SUPPORTED_CHAIN_IDS) {
    byChain[chainId] = [toNativeToken(chainId)];
  }

  for (const token of tokens) {
    if (!SUPPORTED_CHAIN_IDS.includes(token.chainId)) {
      continue;
    }

    const chainTokens = byChain[token.chainId] ?? [];
    if (!chainTokens.some((entry) => entry.address.toLowerCase() === token.address.toLowerCase())) {
      chainTokens.push(token);
    }

    byChain[token.chainId] = chainTokens;
    const normalized = token.address.toLowerCase();
    byAddress[normalized] = token;
    byAddress[`${token.chainId}:${normalized}`] = token;
  }

  for (const chainId of SUPPORTED_CHAIN_IDS) {
    byChain[chainId] = (byChain[chainId] ?? []).slice();
  }

  const flatTokens = SUPPORTED_CHAIN_IDS.flatMap((chainId) => byChain[chainId] ?? []);
  return {
    tokens: flatTokens,
    fetchedAt,
    byChain,
    byAddress,
  };
}

function normalizeTokens(tokens: TokenListPayload['tokens']): TokenInfo[] {
  const normalized: TokenInfo[] = [];

  for (const token of tokens) {
    if (!SUPPORTED_CHAIN_IDS.includes(token.chainId)) {
      continue;
    }

    if (!isAddress(token.address)) {
      continue;
    }

    const symbol = token.symbol.trim();
    const name = token.name.trim();
    if (symbol.length === 0 || name.length === 0) {
      continue;
    }

    const decimals = Number(token.decimals);
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
      continue;
    }

    normalized.push({
      chainId: token.chainId,
      address: getAddress(token.address),
      symbol,
      name,
      decimals,
      logoURI: token.logoURI,
      isNative: false,
    });
  }

  return dedupeTokens(normalized);
}

function dedupeTokens(tokens: TokenInfo[]): TokenInfo[] {
  const seen = new Map<string, TokenInfo>();
  for (const token of tokens) {
    const key = `${token.chainId}:${token.address.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.set(key, token);
    }
  }

  return Array.from(seen.values());
}

function toNativeToken(chainId: number): TokenInfo {
  const native = getNativeToken(chainId);
  return {
    chainId,
    address: NATIVE_TOKEN_SENTINEL,
    symbol: native.symbol,
    name: native.name,
    decimals: native.decimals,
    logoURI: getTokenLogoUrl(native.logoAddress, chainId),
    isNative: true,
  };
}

function persistCache(cache: TokenListCache): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(CACHE_KEY, JSON.stringify(cache));
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

function isTokenListPayload(payload: unknown): payload is TokenListPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const tokens = (payload as Record<string, unknown>)['tokens'];
  return Array.isArray(tokens);
}

function validateCachedPayload(payload: unknown): TokenListCache | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const root = payload as Record<string, unknown>;
  const fetchedAt = root['fetchedAt'];
  if (typeof fetchedAt !== 'number' || !Number.isFinite(fetchedAt)) {
    return null;
  }

  const tokensValue = root['tokens'];
  if (!Array.isArray(tokensValue)) {
    return null;
  }

  const normalizedTokens: TokenInfo[] = [];
  for (const item of tokensValue) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const candidate = item as Record<string, unknown>;
    const chainId = candidate['chainId'];
    const address = candidate['address'];
    const symbol = candidate['symbol'];
    const name = candidate['name'];
    const decimals = candidate['decimals'];
    const logoURI = candidate['logoURI'];
    const isNative = candidate['isNative'];

    if (typeof chainId !== 'number' || typeof address !== 'string' || typeof symbol !== 'string') {
      continue;
    }

    if (typeof name !== 'string' || typeof decimals !== 'number') {
      continue;
    }

    normalizedTokens.push({
      chainId,
      address,
      symbol,
      name,
      decimals,
      logoURI: typeof logoURI === 'string' ? logoURI : undefined,
      isNative: typeof isNative === 'boolean' ? isNative : undefined,
    });
  }

  return buildCache(normalizedTokens, fetchedAt);
}
