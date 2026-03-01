import type { SwapIntent } from '@/types/intent';

/**
 * Parser contract for natural-language to SwapIntent conversion.
 */
export interface IntentParser {
  parse(input: string): Promise<SwapIntent>;
}
