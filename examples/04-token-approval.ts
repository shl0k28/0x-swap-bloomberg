/**
 * 04-token-approval.ts
 *
 * Demonstrates explicit ERC-20 allowance management for 0x swap execution.
 * This is the critical pre-flight flow for non-native token sells.
 */

import pc from 'picocolors';
import { isAddress, parseUnits } from 'viem';
import { resolveToken } from '@/constants/tokens';
import { approveTokenUnlimited, readTokenAllowance } from '@/actions/approval';
import { getExecutionClients, getServices, printHeader } from './_helpers';

async function main(): Promise<void> {
  const prompt = process.argv.slice(2).join(' ') || 'quote 50 USDC for ETH on Ethereum';

  printHeader('Example 04: Token Approval Flow', `Prompt: ${prompt}`);

  const { services } = getServices();
  const intent = await services.intentParser.parse(prompt);
  const { account, walletClient, publicClient } = getExecutionClients(intent.chainId);

  const token = resolveToken(intent.chainId, intent.sellToken);
  if (token.isNative) {
    console.log(pc.green('Native token detected. No approval required.'));
    return;
  }

  if (!isAddress(token.addressOrSymbol)) {
    throw new Error('Resolved token address is invalid for approval checks');
  }

  const quote = await services.swapApi.getPrice({
    chainId: intent.chainId,
    sellToken: token.addressOrSymbol,
    buyToken: resolveToken(intent.chainId, intent.buyToken).addressOrSymbol,
    sellAmount: parseUnits(intent.amount, token.decimals).toString(),
    taker: account.address,
    slippageBps: intent.slippageBps,
  });

  const spender = quote.issues.allowance?.spender ?? quote.allowanceTarget;
  if (!spender) {
    throw new Error('0x did not return an allowance target for this quote');
  }

  const currentAllowance = await readTokenAllowance(publicClient, token.addressOrSymbol, account.address, spender);
  console.log(`${pc.dim('Current allowance')}: ${currentAllowance.toString()}`);

  if (quote.issues.allowance) {
    console.log(pc.yellow('Allowance insufficient, sending unlimited approval...'));
    const hash = await approveTokenUnlimited(walletClient, token.addressOrSymbol, spender);
    console.log(pc.dim(`Approval tx: ${hash}`));
    await publicClient.waitForTransactionReceipt({ hash });

    const updatedAllowance = await readTokenAllowance(
      publicClient,
      token.addressOrSymbol,
      account.address,
      spender,
    );
    console.log(`${pc.green('Updated allowance')}: ${updatedAllowance.toString()}`);
  } else {
    console.log(pc.green('Allowance is already sufficient for this trade size.'));
  }
}

main().catch((error: unknown) => {
  console.error(pc.red(`\nError: ${error instanceof Error ? error.message : String(error)}`));
  process.exit(1);
});
