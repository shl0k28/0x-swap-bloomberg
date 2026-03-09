import type { RuntimeConfig } from '@/config/runtime-types';
import { createIntentParser } from '@/intents/createIntentParser';
import { ZeroExHttpClient } from '@/adapters/zeroex/httpClient';
import { ZeroExSwapApi } from '@/adapters/zeroex/swapApi';
import { ZeroExGaslessApi } from '@/adapters/zeroex/gaslessApi';
import { SwapActionService } from '@/actions/swapAction';
import { GaslessActionService } from '@/actions/gaslessAction';

/**
 * Resolved service container used by app and scripts.
 */
export interface ValenceServices {
  intentParser: ReturnType<typeof createIntentParser>;
  swapApi: ZeroExSwapApi;
  gaslessApi: ZeroExGaslessApi;
  swapAction: SwapActionService;
  gaslessAction: GaslessActionService;
}

/**
 * Builds all protocol services from runtime configuration.
 */
export function createValenceServices(config: RuntimeConfig): ValenceServices {
  const client = new ZeroExHttpClient({
    apiKey: config.zeroExApiKey,
    baseUrl: config.zeroExApiBaseUrl,
  });

  const swapApi = new ZeroExSwapApi(client);
  const gaslessApi = new ZeroExGaslessApi(client);

  return {
    intentParser: createIntentParser({
      openAiApiKey: config.openAiApiKey,
      openAiModel: config.openAiModel,
    }),
    swapApi,
    gaslessApi,
    swapAction: new SwapActionService(swapApi),
    gaslessAction: new GaslessActionService(gaslessApi),
  };
}
