import type { IntentParser } from '@/intents/intentParser';
import { FallbackIntentParser } from '@/intents/fallbackParser';
import { OpenAiIntentParser } from '@/intents/openAiParser';

/**
 * Parser configuration for selecting LLM vs deterministic mode.
 */
export interface CreateIntentParserConfig {
  openAiApiKey?: string;
  openAiModel: string;
}

/**
 * Creates the best available parser for current runtime configuration.
 */
export function createIntentParser(config: CreateIntentParserConfig): IntentParser {
  if (config.openAiApiKey) {
    return new OpenAiIntentParser({
      apiKey: config.openAiApiKey,
      model: config.openAiModel,
    });
  }

  return new FallbackIntentParser();
}
