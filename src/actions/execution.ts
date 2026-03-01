import type { PublicClient, WalletClient } from 'viem';
import { isAddress, isHex } from 'viem';
import type { ZeroExSwapResponse } from '@/types/zeroex';

/**
 * Validates quote transaction fields before wallet submission.
 */
function validateQuoteTransaction(quote: ZeroExSwapResponse): void {
  if (!isAddress(quote.transaction.to)) {
    throw new Error('Invalid transaction target address in quote');
  }

  if (!isHex(quote.transaction.data) || quote.transaction.data === '0x') {
    throw new Error('Invalid or empty transaction calldata in quote');
  }
}

/**
 * Executes swap transaction and waits for inclusion.
 */
export async function executeSwapQuote(
  walletClient: WalletClient,
  publicClient: PublicClient,
  quote: ZeroExSwapResponse,
): Promise<`0x${string}`> {
  validateQuoteTransaction(quote);

  const account = walletClient.account;
  if (!account) {
    throw new Error('Wallet is not connected');
  }

  const hash = await walletClient.sendTransaction({
    account,
    chain: walletClient.chain,
    to: quote.transaction.to,
    data: quote.transaction.data,
    value: BigInt(quote.transaction.value),
    gas: quote.transaction.gas ? BigInt(quote.transaction.gas) : undefined,
    gasPrice: quote.transaction.gasPrice ? BigInt(quote.transaction.gasPrice) : undefined,
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
