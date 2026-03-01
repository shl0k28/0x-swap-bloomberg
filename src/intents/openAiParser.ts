import OpenAI from 'openai';
import { swapIntentSchema, type SwapIntent } from '@/types/intent';
import type { IntentParser } from '@/intents/intentParser';
import { FallbackIntentParser } from '@/intents/fallbackParser';

/**
 * Constructor options for OpenAI-based intent parsing.
 */
export interface OpenAiIntentParserConfig {
  apiKey: string;
  model: string;
}

/**
 * LLM parser with strict schema validation and deterministic fallback.
 */
export class OpenAiIntentParser implements IntentParser {
  private readonly client: OpenAI;

  private readonly model: string;

  private readonly fallback: FallbackIntentParser;

  public constructor(config: OpenAiIntentParserConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey, dangerouslyAllowBrowser: true });
    this.model = config.model;
    this.fallback = new FallbackIntentParser();
  }

  /**
   * Parses natural-language input using OpenAI JSON output.
   */
  public async parse(input: string): Promise<SwapIntent> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Convert trading text into JSON with fields: action, chainId, sellToken, buyToken, amount, side, slippageBps, deadlineMinutes, gasless. Use side="sell". Default chainId=1, slippageBps=50, deadlineMinutes=20.',
          },
          { role: 'user', content: input },
        ],
      });

      const rawContent = response.choices[0]?.message?.content;
      if (!rawContent) {
        return this.fallback.parse(input);
      }

      const parsedPayload = JSON.parse(rawContent) as unknown;
      if (typeof parsedPayload !== 'object' || parsedPayload === null) {
        return this.fallback.parse(input);
      }

      return swapIntentSchema.parse({
        ...(parsedPayload as Record<string, unknown>),
        rawInput: input,
      });
    } catch {
      return this.fallback.parse(input);
    }
  }
}
