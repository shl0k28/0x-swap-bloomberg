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

/**
 * Chain RPC endpoints routed through Alchemy.
 */
export const ALCHEMY_RPC: Record<number, string> = {
  1: `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
  137: `https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
  10: `https://opt-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
  42161: `https://arb-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
  8453: `https://base-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
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
