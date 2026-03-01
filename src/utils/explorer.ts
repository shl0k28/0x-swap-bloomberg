/**
 * Builds chain explorer transaction URL.
 */
export function getExplorerTxUrl(chainId: number, hash: string): string {
  const baseByChain: Record<number, string> = {
    1: 'https://etherscan.io/tx/',
    8453: 'https://basescan.org/tx/',
    42161: 'https://arbiscan.io/tx/',
    10: 'https://optimistic.etherscan.io/tx/',
    137: 'https://polygonscan.com/tx/',
  };

  const base = baseByChain[chainId] ?? baseByChain[1];
  return `${base}${hash}`;
}
