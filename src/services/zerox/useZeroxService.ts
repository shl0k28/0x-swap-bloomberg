import { useMemo } from 'react';
import { loadBrowserRuntimeConfig } from '@/config/browserRuntime';
import { ZeroxService } from '@/services/zerox/zeroxService';

/**
 * Provides a memoized typed 0x service instance for React components.
 */
export function useZeroxService(): ZeroxService {
  return useMemo(() => {
    const runtime = loadBrowserRuntimeConfig();
    return new ZeroxService(runtime);
  }, []);
}
