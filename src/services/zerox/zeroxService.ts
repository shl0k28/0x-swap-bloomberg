import { parseUnits, type Address } from 'viem';
import { ZeroExGaslessApi } from '@/adapters/zeroex/gaslessApi';
import { ZeroExHttpClient } from '@/adapters/zeroex/httpClient';
import { ZeroExSwapApi } from '@/adapters/zeroex/swapApi';
import { getTokensForChain, NATIVE_TOKEN_SENTINEL, resolveToken } from '@/constants/tokens';
import type { RuntimeConfig } from '@/config/runtime-types';
import type { ZeroExGaslessStatusResponse, ZeroExGaslessSubmitResponse } from '@/types/zeroex';
import type {
  GaslessEligibility,
  GaslessQuoteEnvelope,
  GaslessQuoteRequest,
  SwapQuoteEnvelope,
  SwapQuoteRequest,
  TickerRow,
} from '@/services/zerox/types';

/**
 * Typed 0x service layer used by all React components.
 */
export class ZeroxService {
  private readonly swapApi: ZeroExSwapApi;

  private readonly gaslessApi: ZeroExGaslessApi;

  public constructor(config: RuntimeConfig) {
    const client = new ZeroExHttpClient({
      apiKey: config.zeroExApiKey,
      baseUrl: config.zeroExApiBaseUrl,
    });

    this.swapApi = new ZeroExSwapApi(client);
    this.gaslessApi = new ZeroExGaslessApi(client);
  }

  /**
   * Fetches either executable quote or indicative price from swap API.
   */
  public async getSwapQuote(request: SwapQuoteRequest): Promise<SwapQuoteEnvelope> {
    const resolvedSellToken = resolveToken(request.chainId, request.sellToken);
    const resolvedBuyToken = resolveToken(request.chainId, request.buyToken);
    const sellAmountBaseUnits = parseUnits(request.amount, resolvedSellToken.decimals).toString();

    const response = request.executable
      ? await this.swapApi.getQuote({
          chainId: request.chainId,
          sellToken: resolvedSellToken.addressOrSymbol,
          buyToken: resolvedBuyToken.addressOrSymbol,
          sellAmount: sellAmountBaseUnits,
          taker: request.taker,
          slippageBps: Math.round(request.slippagePct * 100),
        })
      : await this.swapApi.getPrice({
          chainId: request.chainId,
          sellToken: resolvedSellToken.addressOrSymbol,
          buyToken: resolvedBuyToken.addressOrSymbol,
          sellAmount: sellAmountBaseUnits,
          taker: request.taker,
          slippageBps: Math.round(request.slippagePct * 100),
        });

    const priceImpactPct = this.calculatePriceImpact(response.buyAmount, response.minBuyAmount);

    return {
      request,
      resolvedSellToken,
      resolvedBuyToken,
      sellAmountBaseUnits,
      response,
      priceImpactPct,
    };
  }

  /**
   * Fetches either executable quote or indicative price from gasless API.
   */
  public async getGaslessQuote(request: GaslessQuoteRequest): Promise<GaslessQuoteEnvelope> {
    const resolvedSellToken = resolveToken(request.chainId, request.sellToken);
    const resolvedBuyToken = resolveToken(request.chainId, request.buyToken);
    const sellAmountBaseUnits = parseUnits(request.amount, resolvedSellToken.decimals).toString();

    const response = request.executable
      ? await this.gaslessApi.getQuote({
          chainId: request.chainId,
          sellToken: resolvedSellToken.addressOrSymbol,
          buyToken: resolvedBuyToken.addressOrSymbol,
          sellAmount: sellAmountBaseUnits,
          takerAddress: request.taker,
          slippageBps: Math.round(request.slippagePct * 100),
        })
      : await this.gaslessApi.getPrice({
          chainId: request.chainId,
          sellToken: resolvedSellToken.addressOrSymbol,
          buyToken: resolvedBuyToken.addressOrSymbol,
          sellAmount: sellAmountBaseUnits,
          takerAddress: request.taker,
          slippageBps: Math.round(request.slippagePct * 100),
        });

    return {
      request,
      resolvedSellToken,
      resolvedBuyToken,
      sellAmountBaseUnits,
      response,
    };
  }

  /**
   * Checks whether a token pair is gasless eligible.
   */
  public async checkGaslessEligibility(
    chainId: number,
    sellToken: string,
    buyToken: string,
    taker: Address,
  ): Promise<GaslessEligibility> {
    try {
      await this.getGaslessQuote({
        chainId,
        sellToken,
        buyToken,
        amount: '1',
        slippagePct: 0.5,
        taker,
        executable: false,
      });

      return {
        eligible: true,
        message: 'ELIGIBLE',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ineligible token pair';
      return {
        eligible: false,
        message,
      };
    }
  }

  /**
   * Submits signed gasless payload.
   */
  public async submitGaslessTrade(params: {
    chainId: number;
    tradeHash: `0x${string}`;
    permit2Signature: `0x${string}`;
    approvalSignature?: `0x${string}`;
  }): Promise<ZeroExGaslessSubmitResponse> {
    return this.gaslessApi.submitTrade({
      chainId: params.chainId,
      tradeHash: params.tradeHash,
      permit2Signature: params.permit2Signature,
      approvalSignature: params.approvalSignature,
      approvalSignatureType: params.approvalSignature ? 'eip712' : undefined,
    });
  }

  /**
   * Fetches gasless trade status.
   */
  public async getGaslessStatus(tradeHash: string): Promise<ZeroExGaslessStatusResponse> {
    return this.gaslessApi.getStatus(tradeHash);
  }

  /**
   * Fetches ticker rows for the left market panel.
   */
  public async getTickerRows(chainId: number, taker: Address): Promise<TickerRow[]> {
    const chainTokens = getTokensForChain(chainId);
    const btcToken =
      chainTokens.find((token) => token.symbol === 'WBTC') ??
      chainTokens.find((token) => token.symbol === 'cbBTC');
    const usdcToken = chainTokens.find((token) => token.symbol === 'USDC');
    const usdtToken = chainTokens.find((token) => token.symbol === 'USDT');

    const specs = [
      {
        symbol: 'ETH',
        quoteSymbol: 'USDC',
        sellToken: NATIVE_TOKEN_SENTINEL,
        buyToken: usdcToken?.address ?? 'USDC',
        amount: '0.01',
        decimals: 18,
      },
      {
        symbol: 'BTC',
        quoteSymbol: 'USDC',
        sellToken: btcToken?.address ?? 'WBTC',
        buyToken: usdcToken?.address ?? 'USDC',
        amount: '0.001',
        decimals: 8,
      },
      {
        symbol: 'SOL',
        quoteSymbol: 'USDC',
        sellToken: 'SOL',
        buyToken: usdcToken?.address ?? 'USDC',
        amount: '0.1',
        decimals: 9,
      },
      {
        symbol: 'USDT',
        quoteSymbol: 'USDC',
        sellToken: usdcToken?.address ?? 'USDC',
        buyToken: usdtToken?.address ?? 'USDT',
        amount: '1000',
        decimals: 6,
      },
    ] as const;

    const results = await Promise.all(
      specs.map(async (spec) => {
        try {
          const sellAmount = parseUnits(spec.amount, spec.decimals).toString();
          const response = await this.swapApi.getPrice({
            chainId,
            sellToken: spec.sellToken,
            buyToken: spec.buyToken,
            sellAmount,
            taker,
            slippageBps: 50,
          });

          const buyValue = Number(response.buyAmount);
          const sellValue = Number(response.sellAmount);
          return {
            symbol: spec.symbol,
            quoteSymbol: spec.quoteSymbol,
            price: sellValue > 0 ? buyValue / sellValue : 0,
            changePct: 0,
            isStale: false,
          } satisfies TickerRow;
        } catch {
          return {
            symbol: spec.symbol,
            quoteSymbol: spec.quoteSymbol,
            price: 0,
            changePct: 0,
            isStale: true,
          } satisfies TickerRow;
        }
      }),
    );

    return results;
  }

  /**
   * Measures API health and round-trip latency.
   */
  public async pingApi(chainId: number, taker: Address): Promise<{ online: boolean; latencyMs: number }> {
    const chainTokens = getTokensForChain(chainId);
    const sell = chainTokens.find((token) => token.symbol === 'ETH') ?? chainTokens[0];
    const buy = chainTokens.find((token) => token.symbol === 'USDC') ?? chainTokens[1] ?? chainTokens[0];

    if (!sell || !buy) {
      return { online: false, latencyMs: 0 };
    }

    const startedAt = performance.now();
    try {
      await this.getSwapQuote({
        chainId,
        sellToken: sell.symbol,
        buyToken: buy.symbol,
        amount: '0.001',
        slippagePct: 0.5,
        taker,
        executable: false,
      });

      return {
        online: true,
        latencyMs: Math.round(performance.now() - startedAt),
      };
    } catch {
      return {
        online: false,
        latencyMs: Math.round(performance.now() - startedAt),
      };
    }
  }

  /**
   * Approximates price impact from buy/min-buy difference.
   */
  private calculatePriceImpact(buyAmount: string, minBuyAmount?: string): number {
    if (!minBuyAmount) {
      return 0;
    }

    const buy = BigInt(buyAmount);
    if (buy === 0n) {
      return 0;
    }

    const minBuy = BigInt(minBuyAmount);
    const impactBps = Number(((buy - minBuy) * 10_000n) / buy);
    return impactBps / 100;
  }
}
