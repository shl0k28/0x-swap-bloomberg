/**
 * Human-readable chain labels for terminal status surfaces.
 */
export const CHAIN_LABEL: Record<number, string> = {
  1: 'ETHEREUM',
  137: 'POLYGON',
  10: 'OPTIMISM',
  42161: 'ARBITRUM',
  8453: 'BASE',
};

const alchemyApiKey = ((import.meta.env['VITE_ALCHEMY_API_KEY'] as string | undefined) ?? '').trim();

const ALCHEMY_NETWORK_SEGMENT: Record<number, string> = {
  1: 'eth-mainnet',
  137: 'polygon-mainnet',
  10: 'opt-mainnet',
  42161: 'arb-mainnet',
  8453: 'base-mainnet',
};

function buildAlchemyUrl(chainId: number, key: string): string | null {
  const network = ALCHEMY_NETWORK_SEGMENT[chainId] ?? ALCHEMY_NETWORK_SEGMENT[1];
  if (!network || key.length === 0) {
    return null;
  }

  return `https://${network}.g.alchemy.com/v2/${key}`;
}

/**
 * Chain RPC endpoints routed through Alchemy.
 */
export const ALCHEMY_RPC: Record<number, string> = {
  1: buildAlchemyUrl(1, alchemyApiKey) ?? '',
  137: buildAlchemyUrl(137, alchemyApiKey) ?? '',
  10: buildAlchemyUrl(10, alchemyApiKey) ?? '',
  42161: buildAlchemyUrl(42161, alchemyApiKey) ?? '',
  8453: buildAlchemyUrl(8453, alchemyApiKey) ?? '',
};

/**
 * Returns whether the app has an Alchemy key configured.
 */
export function hasAlchemyApiKey(): boolean {
  return alchemyApiKey.length > 0;
}

/**
 * Resolves Alchemy RPC URL for a chain.
 */
export function getAlchemyRpc(chainId: number): string | null {
  if (!hasAlchemyApiKey()) {
    return null;
  }

  return ALCHEMY_RPC[chainId] ?? ALCHEMY_RPC[1] ?? null;
}

/**
 * Demo Alchemy endpoints for resilient read-only status fallback.
 */
export function getAlchemyDemoRpc(chainId: number): string {
  return buildAlchemyUrl(chainId, 'demo') ?? 'https://eth-mainnet.g.alchemy.com/v2/demo';
}
