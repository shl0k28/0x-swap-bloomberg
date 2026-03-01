import type { ZeroExSwapQuery, ZeroExSwapResponse } from '@/types/zeroex';
import type { ZeroExHttpClient } from '@/adapters/zeroex/httpClient';

/**
 * Adapter for 0x Swap API v2 allowance-holder endpoints.
 */
export class ZeroExSwapApi {
  private readonly client: ZeroExHttpClient;

  public constructor(client: ZeroExHttpClient) {
    this.client = client;
  }

  /**
   * Fetches non-executable price data for a swap query.
   */
  public async getPrice(query: ZeroExSwapQuery): Promise<ZeroExSwapResponse> {
    return this.client.get<ZeroExSwapResponse>('/swap/allowance-holder/price', {
      chainId: query.chainId,
      sellToken: query.sellToken,
      buyToken: query.buyToken,
      sellAmount: query.sellAmount,
      taker: query.taker,
      slippageBps: query.slippageBps,
    });
  }

  /**
   * Fetches executable quote data including transaction payload.
   */
  public async getQuote(query: ZeroExSwapQuery): Promise<ZeroExSwapResponse> {
    return this.client.get<ZeroExSwapResponse>('/swap/allowance-holder/quote', {
      chainId: query.chainId,
      sellToken: query.sellToken,
      buyToken: query.buyToken,
      sellAmount: query.sellAmount,
      taker: query.taker,
      slippageBps: query.slippageBps,
    });
  }
}
