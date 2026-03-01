/**
 * 07-price-watch.ts
 *
 * Streams live quote updates on an interval and highlights directional deltas
 * so quote drift can be observed in real time.
 */

import pc from 'picocolors';
import { formatUnits } from 'viem';
import { getServices, getTakerAddress, printHeader } from './_helpers';

/**
 * Async sleep helper.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const prompt = process.argv.slice(2).join(' ') || 'quote 0.05 ETH for USDC on Base';
  const iterations = Number(process.env['PRICE_WATCH_TICKS'] ?? '12');
  const intervalMs = Number(process.env['PRICE_WATCH_INTERVAL_MS'] ?? '5000');

  printHeader('Example 07: Price Watch', `Prompt: ${prompt}`);

  const { services } = getServices();
  const intent = await services.intentParser.parse(prompt);

  let previousBuy: bigint | null = null;

  for (let i = 0; i < iterations; i += 1) {
    const quote = await services.swapAction.quoteIntent(intent, getTakerAddress());
    const buyAmount = BigInt(quote.quote.buyAmount);
    const buyReadable = Number(formatUnits(buyAmount, quote.resolvedBuyToken.decimals));

    const delta = previousBuy === null ? 0n : buyAmount - previousBuy;
    const sign = delta === 0n ? pc.gray('=') : delta > 0n ? pc.green('▲') : pc.red('▼');
    const deltaText =
      previousBuy === null
        ? pc.gray('n/a')
        : `${sign} ${formatUnits(delta < 0n ? -delta : delta, quote.resolvedBuyToken.decimals)} ${quote.resolvedBuyToken.symbol}`;

    console.log(
      `${pc.dim(`[${new Date().toLocaleTimeString()}]`)} ${pc.bold(buyReadable.toFixed(4))} ${quote.resolvedBuyToken.symbol} ${pc.dim('| delta')} ${deltaText}`,
    );

    previousBuy = buyAmount;
    if (i < iterations - 1) {
      await sleep(intervalMs);
    }
  }
}

main().catch((error: unknown) => {
  console.error(pc.red(`\nError: ${error instanceof Error ? error.message : String(error)}`));
  process.exit(1);
});
