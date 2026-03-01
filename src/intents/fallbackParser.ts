import { swapIntentSchema, type SwapIntent } from '@/types/intent';
import { isSupportedChainId, type SupportedChainId } from '@/constants/chains';
import type { IntentParser } from '@/intents/intentParser';

/**
 * Built-in deterministic parser used when no LLM key is configured.
 */
export class FallbackIntentParser implements IntentParser {
  /**
   * Parses common swap sentence forms into a structured intent.
   */
  public parse(input: string): Promise<SwapIntent> {
    const normalized = input.trim();

    const action: 'quote' | 'swap' = /\b(quote|price|estimate)\b/i.test(normalized)
      ? 'quote'
      : 'swap';

    const gasless = /\bgasless|meta-?tx|meta transaction\b/i.test(normalized);
    const chainId = this.parseChain(normalized);
    const slippageBps = this.parseSlippage(normalized);
    const deadlineMinutes = this.parseDeadlineMinutes(normalized);
    const [amount, sellToken, buyToken] = this.parseAmountAndPair(normalized);

    const parsed = swapIntentSchema.parse({
      rawInput: normalized,
      action,
      chainId,
      sellToken,
      buyToken,
      amount,
      side: 'sell',
      slippageBps,
      deadlineMinutes,
      gasless,
    });

    return Promise.resolve(parsed);
  }

  /**
   * Extracts chain id from language hints, defaulting to Ethereum.
   */
  private parseChain(input: string): SupportedChainId {
    const chainMap: Array<{ pattern: RegExp; chainId: SupportedChainId }> = [
      { pattern: /\bbase\b/i, chainId: 8453 },
      { pattern: /\barbitrum\b/i, chainId: 42161 },
      { pattern: /\boptimism\b/i, chainId: 10 },
      { pattern: /\bpolygon|matic|pol\b/i, chainId: 137 },
      { pattern: /\beth|ethereum|mainnet\b/i, chainId: 1 },
    ];

    for (const entry of chainMap) {
      if (entry.pattern.test(input) && isSupportedChainId(entry.chainId)) {
        return entry.chainId;
      }
    }

    return 1;
  }

  /**
   * Parses slippage in percent form and converts to bps.
   */
  private parseSlippage(input: string): number {
    const match = input.match(/(\d+(?:\.\d+)?)\s*%\s*slippage/i);

    if (!match?.[1]) {
      return 50;
    }

    return Math.max(1, Math.min(Math.round(Number(match[1]) * 100), 10000));
  }

  /**
   * Parses an optional deadline hint in minutes.
   */
  private parseDeadlineMinutes(input: string): number {
    const match = input.match(/deadline\s*(\d+)\s*(?:m|min|minutes)/i);

    if (!match?.[1]) {
      return 20;
    }

    return Math.max(1, Math.min(Number(match[1]), 240));
  }

  /**
   * Parses amount and token pair from a swap sentence.
   */
  private parseAmountAndPair(input: string): [string, string, string] {
    const direct = input.match(
      /(?:swap|quote|buy|get quote for)\s+([0-9]*\.?[0-9]+)\s+([a-zA-Z0-9x.]+)\s+(?:for|to)\s+([a-zA-Z0-9x.]+)/i,
    );

    if (direct?.[1] && direct[2] && direct[3]) {
      return [direct[1], direct[2], direct[3]];
    }

    const fallback = input.match(/([0-9]*\.?[0-9]+)\s+([a-zA-Z0-9x.]+)\s+(?:for|to)\s+([a-zA-Z0-9x.]+)/i);

    if (fallback?.[1] && fallback[2] && fallback[3]) {
      return [fallback[1], fallback[2], fallback[3]];
    }

    throw new Error(
      'Could not parse swap intent. Try: "swap 1 ETH for USDC on Base with 0.5% slippage".',
    );
  }
}
