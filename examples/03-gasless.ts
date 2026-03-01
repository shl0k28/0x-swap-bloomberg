/**
 * 03-gasless.ts
 *
 * Demonstrates 0x Gasless API execution including permit2 signing,
 * optional allowance approval, submission, and status polling.
 */

import pc from 'picocolors';
import { getExecutionClients, getServices, printHeader } from './_helpers';

async function main(): Promise<void> {
  const prompt = process.argv.slice(2).join(' ') || 'gasless swap 15 USDC for ETH on Ethereum';

  printHeader('Example 03: Gasless Swap', `Prompt: ${prompt}`);

  const { services } = getServices();
  const intent = await services.intentParser.parse(prompt);
  const enforcedIntent = { ...intent, gasless: true };
  const { account, walletClient, publicClient } = getExecutionClients(enforcedIntent.chainId);

  const quoteResult = await services.gaslessAction.quoteIntent(enforcedIntent, account.address);

  if (quoteResult.quote.approval?.isRequired) {
    console.log(pc.yellow('Gasless flow requires approval tx before signing...'));
    const approvalHash = await walletClient.sendTransaction({
      account,
      to: quoteResult.quote.approval.to,
      data: quoteResult.quote.approval.data,
      value: BigInt(quoteResult.quote.approval.value),
    });
    console.log(pc.dim(`Approval tx: ${approvalHash}`));
    await publicClient.waitForTransactionReceipt({ hash: approvalHash });
    console.log(pc.green('Approval confirmed'));
  }

  console.log(pc.cyan('Signing permit2 payload and submitting gasless trade...'));
  const submitResult = await services.gaslessAction.submitSignedTrade(walletClient, quoteResult.quote);
  console.log(pc.dim(`Trade hash: ${submitResult.tradeHash}`));

  const finalStatus = await services.gaslessAction.waitForFinalStatus(submitResult.tradeHash);
  console.log(pc.bold(pc.green(`Final state: ${finalStatus.state}`)));

  if (finalStatus.transactions?.length) {
    for (const transaction of finalStatus.transactions) {
      console.log(`- ${transaction.type ?? 'tx'}: ${transaction.hash}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(pc.red(`\nError: ${error instanceof Error ? error.message : String(error)}`));
  process.exit(1);
});
