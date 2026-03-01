/**
 * 01-quote.ts
 *
 * Demonstrates live quote retrieval from 0x Swap API v2, including route hops,
 * warning signals, and execution-ready transaction metadata.
 */

import pc from 'picocolors';
import { formatUnits } from 'viem';
import { getServices, getTakerAddress, printHeader } from './_helpers';

async function main(): Promise<void> {
  const prompt = process.argv.slice(2).join(' ') || 'quote 1 ETH for USDC on Base';

  printHeader('Example 01: Live Quote', `Prompt: ${prompt}`);

  const { services } = getServices();
  const taker = getTakerAddress();

  const intent = await services.intentParser.parse(prompt);
  const quote = await services.swapAction.quoteIntent(intent, taker);

  console.log(pc.green('Intent parsed successfully'));
  console.log(quote.intent);

  const buyReadable = formatUnits(BigInt(quote.quote.buyAmount), quote.resolvedBuyToken.decimals);
  const sellReadable = formatUnits(BigInt(quote.quote.sellAmount), quote.resolvedSellToken.decimals);

  console.log(pc.bold('\nQuote Summary'));
  console.log(`${pc.dim('Sell')}: ${sellReadable} ${quote.resolvedSellToken.symbol}`);
  console.log(`${pc.dim('Buy')}:  ${buyReadable} ${quote.resolvedBuyToken.symbol}`);
  console.log(`${pc.dim('Chain')}: ${quote.intent.chainId}`);
  console.log(`${pc.dim('Liquidity Available')}: ${quote.quote.liquidityAvailable}`);

  console.log(pc.bold('\nRoute Hops'));
  for (const fill of quote.quote.route.fills) {
    console.log(
      `- ${pc.cyan(fill.from)} ${pc.dim('->')} ${pc.green(fill.to)} via ${pc.yellow(fill.source)} (${fill.proportionBps} bps)`,
    );
  }

  console.log(pc.bold('\nExecution Payload'));
  console.log(`${pc.dim('To')}: ${quote.quote.transaction.to}`);
  console.log(`${pc.dim('Value')}: ${quote.quote.transaction.value}`);
  console.log(`${pc.dim('Gas')}: ${quote.quote.transaction.gas ?? 'N/A'}`);

  if (quote.warnings.length > 0) {
    console.log(pc.bold(pc.yellow('\nWarnings')));
    for (const warning of quote.warnings) {
      console.log(pc.yellow(`- ${warning}`));
    }
  }
}

main().catch((error: unknown) => {
  console.error(pc.red(`\nError: ${error instanceof Error ? error.message : String(error)}`));
  process.exit(1);
});
