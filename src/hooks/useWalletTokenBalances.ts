import { useCallback, useEffect, useMemo, useState } from 'react';
import { type Address } from 'viem';
import { getAlchemyRpc } from '@/constants/alchemyChains';
import { getNativeToken } from '@/constants/nativeTokens';
import { logger } from '@/utils/logger';

interface AlchemyTokenBalance {
  contractAddress: string;
  tokenBalance: string;
}

/**
 * Per-token balance snapshot fetched from Alchemy.
 */
export interface TokenBalance {
  address: string;
  rawBalance: string;
  formattedBalance: string;
  hasBalance: boolean;
}

/**
 * Hook result for wallet token balances keyed by address.
 */
export interface WalletBalancesResult {
  balances: Record<string, TokenBalance>;
  nativeBalance: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface TokenBalancesPayload {
  balances: Record<string, TokenBalance>;
  nativeBalance: string | null;
}

interface JsonRpcResponse<T> {
  result?: T;
}

const ZERO_BALANCE_HEX = '0x0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Fetches wallet-native + ERC-20 balances from Alchemy in O(1) RPC calls.
 */
export function useWalletTokenBalances(
  chainId: number,
  walletAddress?: Address,
): WalletBalancesResult {
  const [balances, setBalances] = useState<Record<string, TokenBalance>>({});
  const [nativeBalance, setNativeBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const refetch = useCallback(() => {
    setRefreshNonce((count) => count + 1);
  }, []);

  const fetchBalances = useMemo(
    () => async () => {
      if (!walletAddress) {
        setBalances({});
        setNativeBalance(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      const rpcUrl = getAlchemyRpc(chainId);
      if (!rpcUrl) {
        if (import.meta.env.DEV) {
          logger.warn('wallet_balance_lookup_missing_alchemy_key', { chainId });
        }
        setIsLoading(false);
        setError('Missing VITE_ALCHEMY_API_KEY');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const next = await fetchTokenBalances(walletAddress, chainId, rpcUrl);
        setBalances(next.balances);
        setNativeBalance(next.nativeBalance);
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : 'Unable to load wallet balances';
        setError(message);
        if (import.meta.env.DEV) {
          logger.warn('wallet_balance_lookup_failed', {
            chainId,
            walletAddress,
            reason: message,
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [chainId, walletAddress],
  );

  useEffect(() => {
    void fetchBalances();
  }, [fetchBalances, refreshNonce]);

  return {
    balances,
    nativeBalance,
    isLoading,
    error,
    refetch,
  };
}

async function fetchTokenBalances(
  walletAddress: string,
  chainId: number,
  rpcUrl: string,
): Promise<TokenBalancesPayload> {
  const erc20Response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'alchemy_getTokenBalances',
      params: [walletAddress, 'erc20'],
    }),
  });

  if (!erc20Response.ok) {
    throw new Error(`alchemy_getTokenBalances failed (${erc20Response.status})`);
  }

  const erc20Data = (await erc20Response.json()) as JsonRpcResponse<{
    tokenBalances?: AlchemyTokenBalance[];
  }>;
  const rawBalances = erc20Data?.result?.tokenBalances ?? [];

  const nativeResponse = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'eth_getBalance',
      params: [walletAddress, 'latest'],
    }),
  });

  if (!nativeResponse.ok) {
    throw new Error(`eth_getBalance failed (${nativeResponse.status})`);
  }

  const nativeData = (await nativeResponse.json()) as JsonRpcResponse<string>;
  const nativeHex = typeof nativeData.result === 'string' ? nativeData.result : '0x0';
  const nativeValue = parseHexBalance(nativeHex);

  const result: Record<string, TokenBalance> = {};
  result['native'] = {
    address: 'native',
    rawBalance: nativeHex,
    formattedBalance: formatBalance(nativeValue, getNativeToken(chainId).decimals),
    hasBalance: nativeValue > 0n,
  };

  for (const tokenBalance of rawBalances) {
    const contractAddress = tokenBalance.contractAddress;
    if (typeof contractAddress !== 'string') {
      continue;
    }

    const rawBalance =
      typeof tokenBalance.tokenBalance === 'string' ? tokenBalance.tokenBalance : ZERO_BALANCE_HEX;
    const parsed = parseHexBalance(rawBalance);
    if (parsed <= 0n) {
      continue;
    }

    const key = contractAddress.toLowerCase();
    result[key] = {
      address: key,
      rawBalance,
      formattedBalance: formatBalance(parsed, 18),
      hasBalance: true,
    };
  }

  return {
    balances: result,
    nativeBalance: result['native']?.formattedBalance ?? null,
  };
}

function parseHexBalance(value: string): bigint {
  if (typeof value !== 'string' || value.length === 0) {
    return 0n;
  }

  if (value === '0x0' || value === ZERO_BALANCE_HEX) {
    return 0n;
  }

  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}

function formatBalance(raw: bigint, decimals: number): string {
  const safeDecimals = Number.isInteger(decimals) && decimals >= 0 ? decimals : 18;
  const divisor = 10n ** BigInt(safeDecimals);
  const whole = raw / divisor;
  const fraction = raw % divisor;

  if (fraction === 0n) {
    return `${whole.toString()}.0000`;
  }

  const fractionPadded = fraction.toString().padStart(safeDecimals, '0').slice(0, 4);
  return `${whole.toString()}.${fractionPadded}`;
}
