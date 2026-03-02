import type { Address, Hex } from 'viem';

/**
 * Single hop/fill segment returned by 0x routeing.
 */
export interface ZeroExRouteFill {
  from: string;
  to: string;
  source: string;
  proportionBps: string;
}

/**
 * Token metadata entry returned by 0x routeing.
 */
export interface ZeroExRouteToken {
  address: string;
  symbol?: string;
}

/**
 * Route structure included in price and quote responses.
 */
export interface ZeroExRoute {
  fills: ZeroExRouteFill[];
  tokens: ZeroExRouteToken[];
}

/**
 * Allowance issue detail from 0x.
 */
export interface ZeroExAllowanceIssue {
  actual: string;
  spender: Address;
}

/**
 * Balance issue detail from 0x.
 */
export interface ZeroExBalanceIssue {
  token: string;
  actual: string;
  expected: string;
}

/**
 * Aggregate issues section from 0x responses.
 */
export interface ZeroExIssues {
  allowance: ZeroExAllowanceIssue | null;
  balance: ZeroExBalanceIssue | null;
  simulationIncomplete: boolean;
  invalidSourcesPassed: string[];
}

/**
 * Blockchain transaction payload returned by 0x.
 */
export interface ZeroExTransaction {
  to: Address;
  data: Hex;
  value: string;
  gas?: string;
  gasPrice?: string;
  from?: Address;
}

/**
 * Common response shape for 0x allowance-holder price/quote.
 */
export interface ZeroExSwapResponse {
  allowanceTarget?: Address;
  blockNumber?: string;
  buyAmount: string;
  buyAmountInEth?: string;
  buyToken: Address;
  chainId: number;
  fees?: Record<string, unknown>;
  issues: ZeroExIssues;
  liquidityAvailable: boolean;
  minBuyAmount?: string;
  route: ZeroExRoute;
  sellAmount: string;
  sellAmountBeforeFeeInEth?: string;
  sellToken: Address | 'ETH';
  estimatedPriceImpact?: number | string;
  tokenMetadata?: Record<string, unknown>;
  totalNetworkFee?: string;
  transaction: ZeroExTransaction;
  zid?: string;
}

/**
 * Parameter set for 0x allowance-holder endpoints.
 */
export interface ZeroExSwapQuery {
  chainId: number;
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  taker: Address;
  slippageBps?: number;
}

/**
 * EIP-712 typed data envelope used in gasless and Permit2 flows.
 */
export interface Eip712TypedData {
  types: Record<string, Array<{ name: string; type: string }>>;
  domain: Record<string, string | number | boolean>;
  primaryType: string;
  message: Record<string, unknown>;
}

/**
 * Permit2 object in gasless responses.
 */
export interface ZeroExGaslessPermit2 {
  type: string;
  hash: Hex;
  eip712: Eip712TypedData;
}

/**
 * Optional approval tx for gasless workflow.
 */
export interface ZeroExGaslessApproval {
  isRequired: boolean;
  to: Address;
  data: Hex;
  value: string;
}

/**
 * Gasless quote response from 0x.
 */
export interface ZeroExGaslessQuoteResponse {
  chainId: number;
  buyAmount: string;
  sellAmount: string;
  buyToken: Address;
  sellToken: Address | 'ETH';
  route: ZeroExRoute;
  issues: ZeroExIssues;
  approval: ZeroExGaslessApproval | null;
  permit2: ZeroExGaslessPermit2;
  trade: {
    hash: Hex;
    type: string;
  };
  fees?: Record<string, unknown>;
  liquidityAvailable: boolean;
  totalNetworkFee?: string;
  zid?: string;
}

/**
 * Request body sent to the gasless submit endpoint.
 */
export interface ZeroExGaslessSubmitRequest {
  chainId: number;
  tradeHash: Hex;
  approvalSignature?: Hex;
  approvalSignatureType?: 'eip712';
  permit2Signature: Hex;
}

/**
 * Submit response containing async trade state.
 */
export interface ZeroExGaslessSubmitResponse {
  tradeHash: Hex;
  state: string;
  reason?: string;
}

/**
 * Trade status response for a submitted gasless swap.
 */
export interface ZeroExGaslessStatusResponse {
  tradeHash: Hex;
  state: string;
  transactions?: Array<{
    hash: Hex;
    timestamp?: string;
    type?: string;
  }>;
  reason?: string;
}
