import { useEffect, useState } from 'react';

const examples = [
  'swap 1 ETH for USDC on Base with 0.5% slippage',
  'get me the best price for 500 USDC -> DAI',
  'gasless swap 0.1 WBTC to ETH, max 1% slippage',
  "what's the current price of ETH in USDC?",
] as const;

/**
 * Rotates through intent examples every 3 seconds.
 */
export function useTypewriterPlaceholder() {
  const [exampleIndex, setExampleIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setExampleIndex((index) => (index + 1) % examples.length);
    }, 3_000);
    return () => window.clearInterval(timer);
  }, []);

  return examples[exampleIndex] ?? examples[0];
}
