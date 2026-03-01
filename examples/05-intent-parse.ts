/**
 * 05-intent-parse.ts
 *
 * Demonstrates the full intent parsing pipeline:
 * raw text -> schema-validated SwapIntent object.
 */

import pc from 'picocolors';
import { getServices, printHeader } from './_helpers';

async function main(): Promise<void> {
  const prompt = process.argv.slice(2).join(' ') || 'swap 1 ETH for USDC on Base with 0.5% slippage';

  printHeader('Example 05: Intent Parsing', `Input: ${prompt}`);

  const { services } = getServices();
  const intent = await services.intentParser.parse(prompt);

  console.log(pc.bold('Parsed SwapIntent'));
  console.log(JSON.stringify(intent, null, 2));
}

main().catch((error: unknown) => {
  console.error(pc.red(`\nError: ${error instanceof Error ? error.message : String(error)}`));
  process.exit(1);
});
