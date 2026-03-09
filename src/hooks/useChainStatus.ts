import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatUnits } from 'viem';
import { usePublicClient } from 'wagmi';
import { getAlchemyRpc, hasAlchemyApiKey } from '@/constants/alchemyChains';
import { logger } from '@/utils/logger';

const POLL_INTERVAL_MS = 12_000;
let didWarnMissingAlchemyKey = false;

interface RpcBatchItem {
  id: number;
  result?: string;
}

/**
 * Chain status metrics shown in terminal status bar.
 */
export interface ChainStatus {
  blockNumber: number | null;
  gasPriceGwei: string | null;
  latencyMs: number | null;
  isLoading: boolean;
  error: string | null;
  updatedAt: number | null;
}

interface ChainSnapshot {
  blockNumber: number;
  gasPriceGwei: string;
  latencyMs: number;
}

/**
 * Fetches block number, gas price, and RPC latency using Alchemy RPC.
 */
export function useChainStatus(chainId: number): ChainStatus {
  const publicClient = usePublicClient({ chainId });
  const [status, setStatus] = useState<ChainStatus>({
    blockNumber: null,
    gasPriceGwei: null,
    latencyMs: null,
    isLoading: true,
    error: null,
    updatedAt: null,
  });
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const readViaPublicClient = useCallback(async (): Promise<ChainSnapshot> => {
    if (!publicClient) {
      throw new Error('Public client unavailable');
    }

    const t0 = performance.now();
    const [blockNumber, gasPrice] = await Promise.all([
      publicClient.getBlockNumber(),
      publicClient.getGasPrice(),
    ]);

    return {
      blockNumber: Number(blockNumber),
      gasPriceGwei: Number(formatUnits(gasPrice, 9)).toFixed(2),
      latencyMs: Math.round(performance.now() - t0),
    };
  }, [publicClient]);

  const readViaAlchemy = useCallback(async (): Promise<ChainSnapshot> => {
    const rpcUrl = getAlchemyRpc(chainId);
    if (!rpcUrl) {
      throw new Error('Missing VITE_ALCHEMY_API_KEY');
    }

    const startedAt = performance.now();
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] },
        { jsonrpc: '2.0', id: 2, method: 'eth_gasPrice', params: [] },
      ]),
    });

    if (!response.ok) {
      throw new Error(`Alchemy RPC ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      throw new Error('Unexpected Alchemy batch payload');
    }

    const rows = payload as RpcBatchItem[];
    const blockHex = rows.find((item) => item.id === 1)?.result;
    const gasHex = rows.find((item) => item.id === 2)?.result;

    if (typeof blockHex !== 'string' || typeof gasHex !== 'string') {
      throw new Error('Incomplete Alchemy response');
    }

    const gasWei = BigInt(gasHex);
    return {
      blockNumber: parseInt(blockHex, 16),
      gasPriceGwei: Number(formatUnits(gasWei, 9)).toFixed(2),
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }, [chainId]);

  const readStatus = useMemo(
    () => async (): Promise<ChainSnapshot> => {
      if (!hasAlchemyApiKey()) {
        if (import.meta.env.DEV && !didWarnMissingAlchemyKey) {
          didWarnMissingAlchemyKey = true;
          logger.warn('missing_alchemy_api_key_falling_back_to_public_client', { chainId });
        }
        return readViaPublicClient();
      }

      try {
        return await readViaAlchemy();
      } catch (error) {
        if (import.meta.env.DEV) {
          logger.warn('alchemy_status_fetch_failed_falling_back', {
            chainId,
            reason: error instanceof Error ? error.message : 'unknown',
          });
        }
        return readViaPublicClient();
      }
    },
    [chainId, readViaAlchemy, readViaPublicClient],
  );

  useEffect(() => {
    let disposed = false;

    const poll = async () => {
      setStatus((current) => ({
        ...current,
        isLoading: true,
      }));

      try {
        const next = await readStatus();
        if (disposed || !isMountedRef.current) {
          return;
        }

        setStatus({
          blockNumber: next.blockNumber,
          gasPriceGwei: next.gasPriceGwei,
          latencyMs: next.latencyMs,
          isLoading: false,
          error: null,
          updatedAt: Date.now(),
        });
      } catch (error) {
        if (disposed || !isMountedRef.current) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Failed to read chain status';
        setStatus((current) => ({
          ...current,
          isLoading: false,
          error: message,
        }));
      }
    };

    void poll();
    const handle = window.setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    return () => {
      disposed = true;
      window.clearInterval(handle);
    };
  }, [readStatus]);

  return status;
}
