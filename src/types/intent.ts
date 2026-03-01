import { z } from 'zod';

/**
 * Supported swap side for current implementation.
 */
export type SwapSide = 'sell';

/**
 * Structured swap intent produced by the parser layer.
 */
export interface SwapIntent {
  rawInput: string;
  action: 'quote' | 'swap';
  chainId: number;
  sellToken: string;
  buyToken: string;
  amount: string;
  side: SwapSide;
  slippageBps: number;
  deadlineMinutes: number;
  gasless: boolean;
}

/**
 * Zod schema used by LLM and fallback parsers to validate an intent payload.
 */
export const swapIntentSchema = z.object({
  rawInput: z.string().min(1),
  action: z.enum(['quote', 'swap']),
  chainId: z.number().int().positive(),
  sellToken: z.string().min(1),
  buyToken: z.string().min(1),
  amount: z.string().regex(/^[0-9]+(\.[0-9]+)?$/),
  side: z.literal('sell'),
  slippageBps: z.number().int().min(1).max(10000),
  deadlineMinutes: z.number().int().min(1).max(240),
  gasless: z.boolean(),
});

/**
 * Type-safe parsed intent inferred from the runtime schema.
 */
export type ParsedSwapIntent = z.infer<typeof swapIntentSchema>;
