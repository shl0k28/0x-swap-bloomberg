import { useQuery } from '@tanstack/react-query';
import { formatUnits, type PublicClient } from 'viem';
import { usePublicClient } from 'wagmi';
import { getAlchemyDemoRpc, getAlchemyRpc, hasAlchemyApiKey } from '@/constants/alchemyChains';
import { logger } from '@/utils/logger';

const POLL_INTERVAL_MS = 12_000;
const STATUS_GC_MS = 300_000;
let didWarnMissingAlchemyKey = false;

interface RpcBatchItem {
  id: number;
  result?: unknown;
}

interface FeeHistoryResult {
  baseFeePerGas?: string[];
}

/**
 * Chain status metrics shown in terminal status bar.
 */
export interface ChainStatus {
  blockNumber: number | null;
  gasPriceGwei: string | null;
  gasDetails: string | null;
  latencyMs: number | null;
  isLoading: boolean;
  error: string | null;
  updatedAt: number | null;
}

interface ChainSnapshot {
  blockNumber: number;
  gasPriceGwei: string;
  gasDetails: string | null;
  latencyMs: number;
}

/**
 * Fetches block number, gas details, and latency with React Query caching.
 */
export function useChainStatus(chainId: number): ChainStatus {
  const publicClient = usePublicClient({ chainId });

  const query = useQuery<ChainSnapshot, Error>({
    queryKey: ['chain-status', chainId, hasAlchemyApiKey() ? 'alchemy' : 'public'],
    queryFn: () => fetchChainStatus(chainId, publicClient),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    staleTime: 10_000,
    gcTime: STATUS_GC_MS,
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
    enabled: chainId > 0,
  });

  return {
    blockNumber: query.data?.blockNumber ?? null,
    gasPriceGwei: query.data?.gasPriceGwei ?? null,
    gasDetails: query.data?.gasDetails ?? null,
    latencyMs: query.data?.latencyMs ?? null,
    isLoading: query.isPending && !query.data,
    error: query.error?.message ?? null,
    updatedAt: query.dataUpdatedAt > 0 ? query.dataUpdatedAt : null,
  };
}

async function fetchChainStatus(
  chainId: number,
  publicClient: PublicClient | undefined,
): Promise<ChainSnapshot> {
  const rpcUrl = getAlchemyRpc(chainId);
  const demoRpcUrl = getAlchemyDemoRpc(chainId);
  if (!rpcUrl || !hasAlchemyApiKey()) {
    if (import.meta.env.DEV && !didWarnMissingAlchemyKey) {
      didWarnMissingAlchemyKey = true;
      logger.warn('missing_alchemy_api_key_falling_back_to_public_client', { chainId });
    }

    try {
      return await readViaAlchemy(demoRpcUrl);
    } catch {
      return readViaPublicClient(publicClient);
    }
  }

  try {
    return await readViaAlchemy(rpcUrl);
  } catch (error) {
    if (import.meta.env.DEV) {
      logger.warn('alchemy_status_fetch_failed_falling_back', {
        chainId,
        reason: error instanceof Error ? error.message : 'unknown',
      });
    }

    try {
      return await readViaAlchemy(demoRpcUrl);
    } catch {
      return readViaPublicClient(publicClient);
    }
  }
}

async function readViaPublicClient(publicClient: PublicClient | undefined): Promise<ChainSnapshot> {
  if (!publicClient) {
    throw new Error('Public client unavailable');
  }

  const startedAt = performance.now();
  const [blockNumber, gasPrice] = await Promise.all([
    publicClient.getBlockNumber(),
    publicClient.getGasPrice(),
  ]);

  return {
    blockNumber: Number(blockNumber),
    gasPriceGwei: Number(formatUnits(gasPrice, 9)).toFixed(2),
    gasDetails: null,
    latencyMs: Math.round(performance.now() - startedAt),
  };
}

async function readViaAlchemy(rpcUrl: string): Promise<ChainSnapshot> {
  const startedAt = performance.now();
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([
      { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] },
      { jsonrpc: '2.0', id: 2, method: 'eth_feeHistory', params: ['0x1', 'latest', [50]] },
      { jsonrpc: '2.0', id: 3, method: 'eth_maxPriorityFeePerGas', params: [] },
      { jsonrpc: '2.0', id: 4, method: 'eth_gasPrice', params: [] },
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
  const feeHistory = rows.find((item) => item.id === 2)?.result;
  const maxPriorityHex = rows.find((item) => item.id === 3)?.result;
  const gasPriceHex = rows.find((item) => item.id === 4)?.result;

  if (typeof blockHex !== 'string') {
    throw new Error('Incomplete Alchemy response');
  }

  const baseFeeGwei = parseBaseFeeGwei(feeHistory);
  const priorityGwei = parseHexGwei(maxPriorityHex);
  const fallbackGas = toFiniteNumber(baseFeeGwei) + toFiniteNumber(priorityGwei);
  const gasPriceGwei = parseHexGwei(gasPriceHex) ?? fallbackGas.toFixed(2);
  const gasDetails =
    baseFeeGwei !== null || priorityGwei !== null
      ? `base ${formatWithTwoDecimals(baseFeeGwei ?? 0)} + prio ${formatWithTwoDecimals(priorityGwei ?? 0)}`
      : null;

  return {
    blockNumber: parseInt(blockHex, 16),
    gasPriceGwei,
    gasDetails,
    latencyMs: Math.round(performance.now() - startedAt),
  };
}

function parseHexGwei(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  try {
    return Number(formatUnits(BigInt(value), 9)).toFixed(2);
  } catch {
    return null;
  }
}

function parseBaseFeeGwei(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const maybeHistory = value as FeeHistoryResult;
  if (!Array.isArray(maybeHistory.baseFeePerGas) || maybeHistory.baseFeePerGas.length === 0) {
    return null;
  }

  const currentBlockBaseFee = maybeHistory.baseFeePerGas[0];
  return parseHexGwei(currentBlockBaseFee);
}

function formatWithTwoDecimals(value: string | number): string {
  const numeric = toFiniteNumber(value);
  return numeric.toFixed(2);
}

function toFiniteNumber(value: string | number | null): number {
  if (value === null) {
    return 0;
  }

  const numeric = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(numeric) ? numeric : 0;
}
