import type { Address } from 'viem';
import { parseUnits } from 'viem';
import { resolveToken } from '@/constants/tokens';
import type { ZeroExSwapApi } from '@/adapters/zeroex/swapApi';
import type { SwapIntent } from '@/types/intent';
import type { ZeroExSwapResponse } from '@/types/zeroex';
import { getUserFacingIssueMessages } from '@/utils/errors';

/**
 * Normalized swap quote object exposed to UI/examples.
 */
export interface SwapQuoteResult {
  intent: SwapIntent;
  resolvedSellToken: ReturnType<typeof resolveToken>;
  resolvedBuyToken: ReturnType<typeof resolveToken>;
  sellAmountBaseUnits: string;
  quote: ZeroExSwapResponse;
  warnings: string[];
}

/**
 * Orchestrates token resolution + 0x quote retrieval.
 */
export class SwapActionService {
  private readonly swapApi: ZeroExSwapApi;

  public constructor(swapApi: ZeroExSwapApi) {
    this.swapApi = swapApi;
  }

  /**
   * Resolves a natural-language intent to an executable 0x quote.
   */
  public async quoteIntent(intent: SwapIntent, taker: Address): Promise<SwapQuoteResult> {
    const resolvedSellToken = resolveToken(intent.chainId, intent.sellToken);
    const resolvedBuyToken = resolveToken(intent.chainId, intent.buyToken);
    const sellAmountBaseUnits = parseUnits(intent.amount, resolvedSellToken.decimals).toString();

    const quote = await this.swapApi.getQuote({
      chainId: intent.chainId,
      sellToken: resolvedSellToken.addressOrSymbol,
      buyToken: resolvedBuyToken.addressOrSymbol,
      sellAmount: sellAmountBaseUnits,
      taker,
      slippageBps: intent.slippageBps,
    });

    const warnings = [
      ...getUserFacingIssueMessages(quote.issues),
      ...this.getPriceImpactWarnings(quote),
    ];

    return {
      intent,
      resolvedSellToken,
      resolvedBuyToken,
      sellAmountBaseUnits,
      quote,
      warnings,
    };
  }

  /**
   * Builds optional warnings based on min-buy vs buy amount spread.
   */
  private getPriceImpactWarnings(quote: ZeroExSwapResponse): string[] {
    const warnings: string[] = [];

    if (!quote.minBuyAmount || quote.buyAmount === '0') {
      return warnings;
    }

    const buyAmount = BigInt(quote.buyAmount);
    const minBuyAmount = BigInt(quote.minBuyAmount);

    if (buyAmount === 0n) {
      return warnings;
    }

    const impactBps = Number(((buyAmount - minBuyAmount) * 10_000n) / buyAmount);

    if (impactBps >= 250) {
      warnings.push(
        `Price impact warning: effective slippage window is ${(impactBps / 100).toFixed(2)}%.`,
      );
    }

    return warnings;
  }
}
