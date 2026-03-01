import type {
  ZeroExGaslessQuoteResponse,
  ZeroExGaslessStatusResponse,
  ZeroExGaslessSubmitRequest,
  ZeroExGaslessSubmitResponse,
} from '@/types/zeroex';
import type { Address } from 'viem';
import type { ZeroExHttpClient } from '@/adapters/zeroex/httpClient';

/**
 * Query params for gasless quote and price endpoints.
 */
export interface ZeroExGaslessQuery {
  chainId: number;
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  takerAddress: Address;
  slippageBps?: number;
}

/**
 * Adapter for 0x Gasless API endpoints.
 */
export class ZeroExGaslessApi {
  private readonly client: ZeroExHttpClient;

  public constructor(client: ZeroExHttpClient) {
    this.client = client;
  }

  /**
   * Fetches indicative gasless pricing information.
   */
  public async getPrice(query: ZeroExGaslessQuery): Promise<ZeroExGaslessQuoteResponse> {
    return this.client.get<ZeroExGaslessQuoteResponse>('/gasless/price', {
      chainId: query.chainId,
      sellToken: query.sellToken,
      buyToken: query.buyToken,
      sellAmount: query.sellAmount,
      takerAddress: query.takerAddress,
      slippageBps: query.slippageBps,
    });
  }

  /**
   * Fetches an executable gasless quote and signing payload.
   */
  public async getQuote(query: ZeroExGaslessQuery): Promise<ZeroExGaslessQuoteResponse> {
    return this.client.get<ZeroExGaslessQuoteResponse>('/gasless/quote', {
      chainId: query.chainId,
      sellToken: query.sellToken,
      buyToken: query.buyToken,
      sellAmount: query.sellAmount,
      takerAddress: query.takerAddress,
      slippageBps: query.slippageBps,
    });
  }

  /**
   * Submits signatures for a gasless quote.
   */
  public async submitTrade(
    request: ZeroExGaslessSubmitRequest,
  ): Promise<ZeroExGaslessSubmitResponse> {
    return this.client.post<ZeroExGaslessSubmitResponse>('/gasless/submit', {
      ...request,
    });
  }

  /**
   * Retrieves latest trade status for a gasless swap.
   */
  public async getStatus(tradeHash: string): Promise<ZeroExGaslessStatusResponse> {
    return this.client.get<ZeroExGaslessStatusResponse>(`/gasless/status/${tradeHash}`, {});
  }
}
