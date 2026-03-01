/**
 * 06-multi-hop.ts
 *
 * Demonstrates route introspection for likely multi-hop trades.
 * Useful for proving understanding of source composition and hop flow.
 */

import pc from 'picocolors';
import { getServices, getTakerAddress, printHeader } from './_helpers';

async function main(): Promise<void> {
  const prompt = process.argv.slice(2).join(' ') || 'quote 5000000 PEPE for USDC on Ethereum';

  printHeader('Example 06: Multi-Hop Route', `Prompt: ${prompt}`);

  const { services } = getServices();
  const intent = await services.intentParser.parse(prompt);
  const quote = await services.swapAction.quoteIntent(intent, getTakerAddress());

  const uniquePairs = new Set(quote.quote.route.fills.map((fill) => `${fill.from}->${fill.to}`));

  console.log(pc.bold(`Hop count: ${uniquePairs.size}`));
  for (const fill of quote.quote.route.fills) {
    console.log(
      `${pc.cyan(fill.from)} ${pc.dim('->')} ${pc.green(fill.to)} ${pc.dim('via')} ${pc.yellow(fill.source)} ${pc.dim(`(${fill.proportionBps} bps)`)}`,
    );
  }

  if (uniquePairs.size < 2) {
    console.log(
      pc.yellow(
        'Route resolved to a single effective hop at this moment. Try a different pair or larger size for richer route splits.',
      ),
    );
  }
}

main().catch((error: unknown) => {
  console.error(pc.red(`\nError: ${error instanceof Error ? error.message : String(error)}`));
  process.exit(1);
});
