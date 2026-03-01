import { useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { useTakerAddress } from '@/hooks/useTakerAddress';
import { useZeroxService } from '@/services/zerox/useZeroxService';
import type { GaslessQuoteEnvelope } from '@/services/zerox/types';
import type { ZeroxService } from '@/services/zerox/zeroxService';
import { useAppStore } from '@/stores/appStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useStatusStore } from '@/stores/statusStore';
import { toViemTypedDataTypes } from '@/utils/eip712';
import { getErrorMessage } from '@/utils/errors';

const executionStateLabel = {
  IDLE: 'SIGN & SUBMIT',
  SIGNING: 'SIGNING...',
  SUBMITTING: 'SUBMITTING...',
  SUCCESS: 'CONFIRMED',
  ERROR: 'FAILED',
} as const;

const pollIntervalMs = 1_500;
const maxPollAttempts = 20;

export type GaslessExecutionState = keyof typeof executionStateLabel;

/**
 * Gasless tab controller for eligibility, quoting, and signed submission.
 */
export function useGaslessTabController() {
  const chainId = useAppStore((state) => state.selectedChainId);
  const draft = useAppStore((state) => state.gaslessDraft);
  const updateDraft = useAppStore((state) => state.updateGaslessDraft);
  const setQuoteSnapshot = useAppStore((state) => state.setQuoteSnapshot);
  const pushOutputLog = useAppStore((state) => state.pushOutputLog);
  const setSuccessMessage = useAppStore((state) => state.setSuccessMessage);
  const setInFlight = useStatusStore((state) => state.setApiRequestInFlight);
  const addTransaction = useHistoryStore((state) => state.addTransaction);
  const updateTransactionStatus = useHistoryStore((state) => state.updateTransactionStatus);
  const taker = useTakerAddress();
  const service = useZeroxService();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [quote, setQuote] = useState<GaslessQuoteEnvelope | null>(null);
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [eligibilityMessage, setEligibilityMessage] = useState('Checking...');
  const [executionState, setExecutionState] = useState<GaslessExecutionState>('IDLE');
  const [error, setError] = useState<string | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);

  useEffect(() => {
    let disposed = false;

    const check = async () => {
      const result = await service.checkGaslessEligibility(
        chainId,
        draft.sellToken,
        draft.buyToken,
        taker,
      );
      if (disposed) {
        return;
      }

      setEligible(result.eligible);
      setEligibilityMessage(result.message);
    };

    void check();
    return () => {
      disposed = true;
    };
  }, [chainId, draft.buyToken, draft.sellToken, service, taker]);

  const fetchQuote = async () => {
    setInFlight(true);
    setIsQuoteLoading(true);
    setError(null);
    try {
      const nextQuote = await service.getGaslessQuote({
        chainId,
        sellToken: draft.sellToken,
        buyToken: draft.buyToken,
        amount: draft.amount,
        slippagePct: Number(draft.slippagePct),
        taker,
        executable: true,
      });

      setQuote(nextQuote);
      setQuoteSnapshot({
        id: crypto.randomUUID(),
        mode: 'gasless',
        pairLabel: `${nextQuote.resolvedSellToken.symbol}/${nextQuote.resolvedBuyToken.symbol}`,
        route: nextQuote.response.route,
        buyAmount: nextQuote.response.buyAmount,
        sellAmount: nextQuote.response.sellAmount,
        buySymbol: nextQuote.resolvedBuyToken.symbol,
        sellSymbol: nextQuote.resolvedSellToken.symbol,
        timestamp: Date.now(),
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setInFlight(false);
      setIsQuoteLoading(false);
    }
  };

  const execute = async () => {
    if (!walletClient || !address || !quote || eligible === false) {
      setError('Gasless trade is not executable in current state.');
      return;
    }

    setInFlight(true);
    setError(null);
    try {
      setExecutionState('SIGNING');
      const signature = await walletClient.signTypedData({
        account: walletClient.account ?? undefined,
        domain: quote.response.permit2.eip712.domain,
        types: toViemTypedDataTypes(quote.response.permit2.eip712.types),
        primaryType: quote.response.permit2.eip712.primaryType,
        message: quote.response.permit2.eip712.message,
      });

      setExecutionState('SUBMITTING');
      const submission = await service.submitGaslessTrade({
        chainId,
        tradeHash: quote.response.trade.hash,
        permit2Signature: signature,
      });

      const txId = addTransaction({
        hash: submission.tradeHash,
        type: 'GASLESS',
        pair: `${draft.sellToken}/${draft.buyToken}`,
        amount: draft.amount,
        status: 'PENDING',
      });

      const status = await pollGaslessStatus(service, submission.tradeHash);
      const upper = status.state.toUpperCase();
      if (upper === 'CONFIRMED') {
        updateTransactionStatus(txId, 'CONFIRMED');
      } else if (upper === 'FAILED') {
        updateTransactionStatus(txId, 'FAILED');
      }

      setExecutionState('SUCCESS');
      setSuccessMessage('GASLESS TRADE COMPLETE');
      pushOutputLog('success', `GASLESS state: ${status.state}`);
      window.setTimeout(() => setSuccessMessage(null), 5_000);
    } catch (requestError) {
      setExecutionState('ERROR');
      setError(getErrorMessage(requestError));
    } finally {
      setInFlight(false);
    }
  };

  return {
    chainId,
    draft,
    address,
    quote,
    eligible,
    eligibilityMessage,
    executionState,
    error,
    isQuoteLoading,
    updateDraft,
    fetchQuote,
    execute,
    executionStateLabel,
  };
}

/**
 * Polls gasless status endpoint until final terminal state or timeout.
 */
async function pollGaslessStatus(
  service: ZeroxService,
  tradeHash: `0x${string}`,
) {
  let last = await service.getGaslessStatus(tradeHash);
  for (let attempt = 0; attempt < maxPollAttempts; attempt += 1) {
    const upper = last.state.toUpperCase();
    if (upper === 'CONFIRMED' || upper === 'FAILED') {
      return last;
    }

    await new Promise((resolve) => window.setTimeout(resolve, pollIntervalMs));
    last = await service.getGaslessStatus(tradeHash);
  }

  return last;
}
