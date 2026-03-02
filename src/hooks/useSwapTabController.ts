import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAddress } from 'viem';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { approveTokenUnlimited } from '@/actions/approval';
import { executeSwapQuote } from '@/actions/execution';
import { useAppStore } from '@/stores/appStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useStatusStore } from '@/stores/statusStore';
import { useTakerAddress } from '@/hooks/useTakerAddress';
import { useTokenBalanceMap } from '@/hooks/useTokenBalanceMap';
import { useZeroxService } from '@/services/zerox/useZeroxService';
import type { SwapQuoteEnvelope } from '@/services/zerox/types';

const stateLabel = {
  IDLE: 'EXECUTE SWAP',
  APPROVING: 'APPROVING...',
  APPROVED: 'APPROVED',
  SWAPPING: 'SWAPPING...',
  SUCCESS: '✓ SWAP CONFIRMED',
  ERROR: '✗ SWAP FAILED',
} as const;

export type ExecutionState = keyof typeof stateLabel;

/**
 * Controller hook encapsulating swap tab quote + execution logic.
 */
export function useSwapTabController() {
  const chainId = useAppStore((state) => state.selectedChainId);
  const draft = useAppStore((state) => state.swapDraft);
  const updateDraft = useAppStore((state) => state.updateSwapDraft);
  const setQuoteSnapshot = useAppStore((state) => state.setQuoteSnapshot);
  const pushOutputLog = useAppStore((state) => state.pushOutputLog);
  const setSuccessMessage = useAppStore((state) => state.setSuccessMessage);
  const setInFlight = useStatusStore((state) => state.setApiRequestInFlight);
  const taker = useTakerAddress();
  const service = useZeroxService();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient();
  const balances = useTokenBalanceMap(chainId, address);
  const addTransaction = useHistoryStore((state) => state.addTransaction);
  const updateTxStatus = useHistoryStore((state) => state.updateTransactionStatus);

  const [quote, setQuote] = useState<SwapQuoteEnvelope | null>(null);
  const [executionState, setExecutionState] = useState<ExecutionState>('IDLE');
  const [isQuoting, setIsQuoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIndicativeQuote = useCallback(async () => {
    const parsedAmount = Number(draft.amount);
    if (
      !draft.sellToken.trim() ||
      !draft.buyToken.trim() ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      setQuote(null);
      setError(null);
      return;
    }

    setInFlight(true);
    setIsQuoting(true);
    try {
      const nextQuote = await service.getSwapQuote({
        chainId,
        sellToken: draft.sellToken,
        buyToken: draft.buyToken,
        amount: draft.amount,
        slippagePct: Number(draft.slippagePct),
        taker,
        executable: false,
      });

      setQuote(nextQuote);
      setQuoteSnapshot({
        id: crypto.randomUUID(),
        mode: 'swap',
        pairLabel: `${nextQuote.resolvedSellToken.symbol}/${nextQuote.resolvedBuyToken.symbol}`,
        route: nextQuote.response.route,
        buyAmount: nextQuote.response.buyAmount,
        sellAmount: nextQuote.response.sellAmount,
        buySymbol: nextQuote.resolvedBuyToken.symbol,
        sellSymbol: nextQuote.resolvedSellToken.symbol,
        timestamp: Date.now(),
      });
      setError(null);
    } catch (requestError) {
      setQuote(null);
      setError(requestError instanceof Error ? requestError.message : 'Quote failed');
    } finally {
      setInFlight(false);
      setIsQuoting(false);
    }
  }, [
    chainId,
    draft.amount,
    draft.buyToken,
    draft.sellToken,
    draft.slippagePct,
    service,
    setInFlight,
    setQuoteSnapshot,
    taker,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchIndicativeQuote();
    }, 500);

    return () => window.clearTimeout(timer);
  }, [fetchIndicativeQuote]);

  const routeSummary = useMemo(() => {
    if (!quote) {
      return 'Best route via -';
    }

    const sources = Array.from(new Set(quote.response.route.fills.map((fill) => fill.source)));
    return `Best route via ${sources.join(' -> ')}`;
  }, [quote]);

  const shouldBlockTrade = (quote?.priceImpactPct ?? 0) > 15;

  const executeSwap = async () => {
    if (!walletClient || !publicClient || !isConnected || !address) {
      setError('Connect wallet before swapping.');
      return;
    }

    setInFlight(true);
    try {
      setExecutionState('SWAPPING');
      const executable = await service.getSwapQuote({
        chainId,
        sellToken: draft.sellToken,
        buyToken: draft.buyToken,
        amount: draft.amount,
        slippagePct: Number(draft.slippagePct),
        taker: address,
        executable: true,
      });

      if (executable.response.issues.allowance && !executable.resolvedSellToken.isNative) {
        setExecutionState('APPROVING');
        const token = executable.resolvedSellToken.addressOrSymbol;
        if (!isAddress(token)) {
          throw new Error('Invalid token approval address');
        }

        const approvalHash = await approveTokenUnlimited(
          walletClient,
          token,
          executable.response.issues.allowance.spender,
        );
        await publicClient.waitForTransactionReceipt({ hash: approvalHash });
        setExecutionState('APPROVED');
      }

      setExecutionState('SWAPPING');
      const swapHash = await executeSwapQuote(walletClient, publicClient, executable.response);
      const txId = addTransaction({
        hash: swapHash,
        type: 'SWAP',
        pair: `${executable.resolvedSellToken.symbol}/${executable.resolvedBuyToken.symbol}`,
        amount: draft.amount,
        status: 'PENDING',
      });

      await publicClient.waitForTransactionReceipt({ hash: swapHash });
      updateTxStatus(txId, 'CONFIRMED');
      setExecutionState('SUCCESS');
      setSuccessMessage(`SWAP CONFIRMED: ${swapHash.slice(0, 10)}...`);
      pushOutputLog('success', `SWAP confirmed ${draft.sellToken} -> ${draft.buyToken}`);
      window.setTimeout(() => {
        setExecutionState('IDLE');
        setSuccessMessage(null);
      }, 2500);
    } catch (requestError) {
      setExecutionState('ERROR');
      const message = requestError instanceof Error ? requestError.message : 'Swap execution failed';
      setError(message);
      pushOutputLog('error', `SWAP failed: ${message}`);
      window.setTimeout(() => setExecutionState('IDLE'), 2500);
    } finally {
      setInFlight(false);
    }
  };

  return {
    chainId,
    draft,
    address,
    isConnected,
    balances,
    quote,
    error,
    routeSummary,
    isQuoting,
    executionState,
    shouldBlockTrade,
    updateDraft,
    executeSwap,
    stateLabel,
  };
}
