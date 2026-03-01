import { useAccount } from 'wagmi';
import { isAddress, type Address } from 'viem';
import { loadBrowserRuntimeConfig } from '@/config/browserRuntime';

const fallbackTaker: Address = '0x1111111111111111111111111111111111111111';

/**
 * Resolves taker address for quote requests.
 */
export function useTakerAddress(): Address {
  const { address } = useAccount();

  if (address && isAddress(address)) {
    return address;
  }

  try {
    const runtime = loadBrowserRuntimeConfig();
    if (runtime.demoWalletAddress) {
      return runtime.demoWalletAddress;
    }
  } catch {
    // no-op
  }

  return fallbackTaker;
}
