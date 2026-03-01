import { useMemo } from 'react';
import { createIntentParser } from '@/intents/createIntentParser';
import { loadBrowserRuntimeConfig } from '@/config/browserRuntime';

/**
 * Returns memoized natural-language parser for INTENT tab.
 */
export function useIntentParser() {
  return useMemo(() => {
    const runtime = loadBrowserRuntimeConfig();
    return createIntentParser({
      openAiApiKey: runtime.openAiApiKey,
      openAiModel: runtime.openAiModel,
    });
  }, []);
}
