import type { Address } from 'viem';

/**
 * Runtime configuration consumed by adapters and parsers.
 */
export interface RuntimeConfig {
  zeroExApiKey?: string;
  zeroExApiBaseUrl: string;
  openAiApiKey?: string;
  openAiModel: string;
  demoWalletAddress?: Address;
}
