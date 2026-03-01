/**
 * 02-swap.ts
 *
 * Demonstrates full end-to-end swap execution:
 * intent parse -> quote -> allowance check/approval -> signed tx submission.
 */

import pc from 'picocolors';
import { isAddress } from 'viem';
import { approveTokenUnlimited } from '@/actions/approval';
import { executeSwapQuote } from '@/actions/execution';
import { getExecutionClients, getServices, printHeader } from './_helpers';

async function main(): Promise<void> {
  const prompt = process.argv.slice(2).join(' ') || 'swap 0.001 ETH for USDC on Base';

  printHeader('Example 02: Execute Swap', `Prompt: ${prompt}`);

  const { services } = getServices();
  const intent = await services.intentParser.parse(prompt);
  const { account, walletClient, publicClient } = getExecutionClients(intent.chainId);

  const quoteResult = await services.swapAction.quoteIntent(intent, account.address);

  if (quoteResult.quote.issues.allowance && !quoteResult.resolvedSellToken.isNative) {
    const tokenAddress = quoteResult.resolvedSellToken.addressOrSymbol;

    if (!isAddress(tokenAddress)) {
      throw new Error('Resolved token address is invalid for approval');
    }

    console.log(pc.yellow('Allowance insufficient, submitting approval...'));
    const approvalHash = await approveTokenUnlimited(
      walletClient,
      tokenAddress,
      quoteResult.quote.issues.allowance.spender,
    );
    console.log(pc.dim(`Approval tx: ${approvalHash}`));
    await publicClient.waitForTransactionReceipt({ hash: approvalHash });
    console.log(pc.green('Approval confirmed'));
  }

  console.log(pc.cyan('Submitting swap transaction...'));
  const swapHash = await executeSwapQuote(walletClient, publicClient, quoteResult.quote);
  console.log(pc.bold(pc.green(`Swap confirmed: ${swapHash}`)));
}

main().catch((error: unknown) => {
  console.error(pc.red(`\nError: ${error instanceof Error ? error.message : String(error)}`));
  process.exit(1);
});
