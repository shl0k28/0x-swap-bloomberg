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
 * Loads runtime config from browser env variables.
 */
export function loadBrowserRuntimeConfig(): RuntimeConfig {
  return {
    zeroExApiKey: import.meta.env['VITE_ZEROX_API_KEY'] as string | undefined,
    zeroExApiBaseUrl:
      (import.meta.env['VITE_ZEROX_API_BASE_URL'] as string | undefined) ?? '/api/0x',
    openAiApiKey: import.meta.env['VITE_OPENAI_API_KEY'] as string | undefined,
    openAiModel: (import.meta.env['VITE_OPENAI_MODEL'] as string | undefined) ?? 'gpt-4.1-mini',
    demoWalletAddress: normalizeOptionalAddress(
      import.meta.env['VITE_DEMO_WALLET_ADDRESS'] as string | undefined,
    ),
  };
}
