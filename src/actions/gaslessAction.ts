import type { Address, TypedDataParameter, WalletClient } from 'viem';
import { parseUnits } from 'viem';
import { resolveToken } from '@/constants/tokens';
import type { ZeroExGaslessApi } from '@/adapters/zeroex/gaslessApi';
import type { SwapIntent } from '@/types/intent';
import type {
  Eip712TypedData,
  ZeroExGaslessQuoteResponse,
  ZeroExGaslessStatusResponse,
  ZeroExGaslessSubmitResponse,
} from '@/types/zeroex';
import { getUserFacingIssueMessages } from '@/utils/errors';

/**
 * Gasless quote projection used by UI and examples.
 */
export interface GaslessQuoteResult {
  intent: SwapIntent;
  resolvedSellToken: ReturnType<typeof resolveToken>;
  resolvedBuyToken: ReturnType<typeof resolveToken>;
  sellAmountBaseUnits: string;
  quote: ZeroExGaslessQuoteResponse;
  warnings: string[];
}

/**
 * Converts raw typed data parameters into the shape viem expects.
 */
function toViemTypedDataTypes(
  types: Eip712TypedData['types'],
): Record<string, readonly TypedDataParameter[]> {
  const out: Record<string, readonly TypedDataParameter[]> = {};

  for (const [name, entries] of Object.entries(types)) {
    if (name !== 'EIP712Domain') {
      out[name] = entries;
    }
  }

  return out;
}

/**
 * Handles gasless quote/sign/submit lifecycle using 0x Gasless API.
 */
export class GaslessActionService {
  private readonly gaslessApi: ZeroExGaslessApi;

  public constructor(gaslessApi: ZeroExGaslessApi) {
    this.gaslessApi = gaslessApi;
  }

  /**
   * Builds a gasless quote from parsed swap intent.
   */
  public async quoteIntent(intent: SwapIntent, takerAddress: Address): Promise<GaslessQuoteResult> {
    const sellToken = resolveToken(intent.chainId, intent.sellToken);
    const buyToken = resolveToken(intent.chainId, intent.buyToken);
    const sellAmount = parseUnits(intent.amount, sellToken.decimals).toString();

    const quote = await this.gaslessApi.getQuote({
      chainId: intent.chainId,
      sellToken: sellToken.addressOrSymbol,
      buyToken: buyToken.addressOrSymbol,
      sellAmount,
      takerAddress,
      slippageBps: intent.slippageBps,
    });

    return {
      intent,
      resolvedSellToken: sellToken,
      resolvedBuyToken: buyToken,
      sellAmountBaseUnits: sellAmount,
      quote,
      warnings: getUserFacingIssueMessages(quote.issues),
    };
  }

  /**
   * Signs permit2 typed data and submits the trade to 0x.
   */
  public async submitSignedTrade(
    walletClient: WalletClient,
    quote: ZeroExGaslessQuoteResponse,
    approvalSignature?: `0x${string}`,
  ): Promise<ZeroExGaslessSubmitResponse> {
    const account = walletClient.account;
    if (!account) {
      throw new Error('Wallet is not connected');
    }

    const permit2Signature = await walletClient.signTypedData({
      account,
      domain: quote.permit2.eip712.domain,
      types: toViemTypedDataTypes(quote.permit2.eip712.types),
      primaryType: quote.permit2.eip712.primaryType,
      message: quote.permit2.eip712.message,
    });

    return this.gaslessApi.submitTrade({
      chainId: quote.chainId,
      tradeHash: quote.trade.hash,
      approvalSignature,
      approvalSignatureType: approvalSignature ? 'eip712' : undefined,
      permit2Signature,
    });
  }

  /**
   * Polls gasless trade status until final state or timeout.
   */
  public async waitForFinalStatus(
    tradeHash: string,
    options?: { intervalMs?: number; timeoutMs?: number },
  ): Promise<ZeroExGaslessStatusResponse> {
    const intervalMs = options?.intervalMs ?? 2500;
    const timeoutMs = options?.timeoutMs ?? 120000;
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const status = await this.gaslessApi.getStatus(tradeHash);
      const state = status.state.toUpperCase();

      if (state === 'CONFIRMED' || state === 'FAILED' || state === 'CANCELLED') {
        return status;
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error('Timed out waiting for gasless trade confirmation');
  }
}
