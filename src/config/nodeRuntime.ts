import type { Address } from 'viem';
import { isAddress } from 'viem';
import type { RuntimeConfig } from '@/config/runtime-types';

/**
 * Validates and normalizes an optional wallet address.
 */
function normalizeOptionalAddress(value: string | undefined): Address | undefined {
  if (!value) {
    return undefined;
  }

  if (!isAddress(value)) {
    throw new Error(`Invalid address provided: ${value}`);
  }

  return value;
}

/**
 * Loads runtime config from Node.js process env.
 */
export function loadNodeRuntimeConfig(): RuntimeConfig {
  const zeroExApiKey = process.env['ZEROX_API_KEY'] ?? '';

  if (zeroExApiKey.length === 0) {
    throw new Error('Missing ZEROX_API_KEY in environment');
  }

  return {
    zeroExApiKey,
    zeroExApiBaseUrl: process.env['ZEROX_API_BASE_URL'] ?? 'https://api.0x.org',
    openAiApiKey: process.env['OPENAI_API_KEY'],
    openAiModel: process.env['OPENAI_MODEL'] ?? 'gpt-4.1-mini',
    demoWalletAddress: normalizeOptionalAddress(process.env['DEMO_WALLET_ADDRESS']),
  };
}
