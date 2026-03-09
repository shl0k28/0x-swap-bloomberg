import { arbitrum, base, mainnet, optimism, polygon } from 'viem/chains';
import type { Chain } from 'viem/chains';

/**
 * Supported chain IDs for valence.
 */
export const SUPPORTED_CHAIN_IDS = [1, 8453, 42161, 10, 137] as const;

/**
 * Narrow chain-id type based on the supported chain list.
 */
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

/**
 * Metadata used for UX labels and token resolution defaults.
 */
export interface ChainMetadata {
  id: SupportedChainId;
  name: string;
  shortName: string;
  nativeSymbol: string;
  rpcEnvKey: string;
}

/**
 * Canonical metadata map keyed by chain id.
 */
export const CHAIN_METADATA: Record<SupportedChainId, ChainMetadata> = {
  1: {
    id: 1,
    name: 'Ethereum Mainnet',
    shortName: 'Ethereum',
    nativeSymbol: 'ETH',
    rpcEnvKey: 'RPC_URL_MAINNET',
  },
  8453: {
    id: 8453,
    name: 'Base',
    shortName: 'Base',
    nativeSymbol: 'ETH',
    rpcEnvKey: 'RPC_URL_BASE',
  },
  42161: {
    id: 42161,
    name: 'Arbitrum One',
    shortName: 'Arbitrum',
    nativeSymbol: 'ETH',
    rpcEnvKey: 'RPC_URL_ARBITRUM',
  },
  10: {
    id: 10,
    name: 'Optimism',
    shortName: 'Optimism',
    nativeSymbol: 'ETH',
    rpcEnvKey: 'RPC_URL_OPTIMISM',
  },
  137: {
    id: 137,
    name: 'Polygon',
    shortName: 'Polygon',
    nativeSymbol: 'POL',
    rpcEnvKey: 'RPC_URL_POLYGON',
  },
};

/**
 * Viem chain objects keyed by chain id for client construction.
 */
export const VIEM_CHAINS: Record<SupportedChainId, Chain> = {
  1: mainnet,
  8453: base,
  42161: arbitrum,
  10: optimism,
  137: polygon,
};

/**
 * Runtime guard for supported chain IDs.
 */
export function isSupportedChainId(chainId: number): chainId is SupportedChainId {
  return SUPPORTED_CHAIN_IDS.includes(chainId as SupportedChainId);
}

/**
 * Resolves viem chain metadata safely.
 */
export function getViemChain(chainId: number): Chain {
  if (!isSupportedChainId(chainId)) {
    throw new Error(`Unsupported chain id: ${chainId}`);
  }

  return VIEM_CHAINS[chainId];
}
