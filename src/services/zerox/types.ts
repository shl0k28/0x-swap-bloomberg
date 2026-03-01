import type { Address } from 'viem';
import type { ZeroExGaslessQuoteResponse, ZeroExSwapResponse } from '@/types/zeroex';
import type { ResolvedToken } from '@/constants/tokens';

/**
 * Quote request for standard swap API calls.
 */
export interface SwapQuoteRequest {
  chainId: number;
  sellToken: string;
  buyToken: string;
  amount: string;
  slippagePct: number;
  taker: Address;
  executable: boolean;
}

/**
 * Normalized response envelope for swap quote and price calls.
 */
export interface SwapQuoteEnvelope {
  request: SwapQuoteRequest;
  resolvedSellToken: ResolvedToken;
  resolvedBuyToken: ResolvedToken;
  sellAmountBaseUnits: string;
  response: ZeroExSwapResponse;
  priceImpactPct: number;
}

/**
 * Quote request for gasless API calls.
 */
export interface GaslessQuoteRequest {
  chainId: number;
  sellToken: string;
  buyToken: string;
  amount: string;
  slippagePct: number;
  taker: Address;
  executable: boolean;
}

/**
 * Normalized envelope for gasless quote operations.
 */
export interface GaslessQuoteEnvelope {
  request: GaslessQuoteRequest;
  resolvedSellToken: ResolvedToken;
  resolvedBuyToken: ResolvedToken;
  sellAmountBaseUnits: string;
  response: ZeroExGaslessQuoteResponse;
}

/**
 * Live ticker row rendered in left panel.
 */
export interface TickerRow {
  symbol: string;
  quoteSymbol: string;
  price: number;
  changePct: number;
  isStale?: boolean;
}

/**
 * Gasless pair eligibility status.
 */
export interface GaslessEligibility {
  eligible: boolean;
  message: string;
}
