import { useState } from 'react';
import { isAddress } from 'viem';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { approveTokenUnlimited } from '@/actions/approval';
import { executeSwapQuote } from '@/actions/execution';
import { useIntentParser } from '@/hooks/useIntentParser';
import { useTakerAddress } from '@/hooks/useTakerAddress';
import { useTypewriterPlaceholder } from '@/hooks/useTypewriterPlaceholder';
import { useZeroxService } from '@/services/zerox/useZeroxService';
import type { ZeroxService } from '@/services/zerox/zeroxService';
import type { GaslessQuoteEnvelope, SwapQuoteEnvelope } from '@/services/zerox/types';
import { useAppStore } from '@/stores/appStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useStatusStore } from '@/stores/statusStore';
import type { SwapIntent } from '@/types/intent';
import type { PipelineStep } from '@/components/tabs/IntentPipeline';
import { toViemTypedDataTypes } from '@/utils/eip712';
import { getErrorMessage } from '@/utils/errors';

const pollIntervalMs = 1_500;
const maxPollAttempts = 20;

/**
 * Intent tab controller for NL parsing, quote generation, and execution.
 */
export function useIntentTabController() {
  const chainId = useAppStore((state) => state.selectedChainId);
  const intentInput = useAppStore((state) => state.intentInput);
  const setIntentInput = useAppStore((state) => state.setIntentInput);
  const setQuoteSnapshot = useAppStore((state) => state.setQuoteSnapshot);
  const pushOutputLog = useAppStore((state) => state.pushOutputLog);
  const setSuccessMessage = useAppStore((state) => state.setSuccessMessage);
  const setSelectedChainId = useAppStore((state) => state.setSelectedChainId);
  const setInFlight = useStatusStore((state) => state.setApiRequestInFlight);
  const addIntent = useHistoryStore((state) => state.addIntent);
  const addTransaction = useHistoryStore((state) => state.addTransaction);
  const updateTransactionStatus = useHistoryStore((state) => state.updateTransactionStatus);
  const parser = useIntentParser();
  const service = useZeroxService();
  const placeholder = useTypewriterPlaceholder();
  const taker = useTakerAddress();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient();

  const [step, setStep] = useState<PipelineStep | null>(null);
  const [intent, setIntent] = useState<SwapIntent | null>(null);
  const [swapQuote, setSwapQuote] = useState<SwapQuoteEnvelope | null>(null);
  const [gaslessQuote, setGaslessQuote] = useState<GaslessQuoteEnvelope | null>(null);
  const [executionHash, setExecutionHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runPipeline = async () => {
    if (intentInput.trim().length === 0) {
      setError('Intent input cannot be empty.');
      return;
    }

    setInFlight(true);
    setError(null);
    setExecutionHash(null);
    setStep('PARSING');

    try {
      const parsed = await parser.parse(intentInput);
      setIntent(parsed);
      addIntent(intentInput);
      setSelectedChainId(parsed.chainId);
      setStep('QUOTING');

      if (parsed.gasless) {
        const quote = await service.getGaslessQuote({
          chainId: parsed.chainId,
          sellToken: parsed.sellToken,
          buyToken: parsed.buyToken,
          amount: parsed.amount,
          slippagePct: parsed.slippageBps / 100,
          taker,
          executable: false,
        });
        setGaslessQuote(quote);
        setSwapQuote(null);
        setQuoteSnapshot({
          id: crypto.randomUUID(),
          mode: 'intent',
          pairLabel: `${quote.resolvedSellToken.symbol}/${quote.resolvedBuyToken.symbol}`,
          route: quote.response.route,
          buyAmount: quote.response.buyAmount,
          sellAmount: quote.response.sellAmount,
          buySymbol: quote.resolvedBuyToken.symbol,
          sellSymbol: quote.resolvedSellToken.symbol,
          timestamp: Date.now(),
        });
      } else {
        const quote = await service.getSwapQuote({
          chainId: parsed.chainId,
          sellToken: parsed.sellToken,
          buyToken: parsed.buyToken,
          amount: parsed.amount,
          slippagePct: parsed.slippageBps / 100,
          taker,
          executable: false,
        });
        setSwapQuote(quote);
        setGaslessQuote(null);
        setQuoteSnapshot({
          id: crypto.randomUUID(),
          mode: 'intent',
          pairLabel: `${quote.resolvedSellToken.symbol}/${quote.resolvedBuyToken.symbol}`,
          route: quote.response.route,
          buyAmount: quote.response.buyAmount,
          sellAmount: quote.response.sellAmount,
          buySymbol: quote.resolvedBuyToken.symbol,
          sellSymbol: quote.resolvedSellToken.symbol,
          timestamp: Date.now(),
        });
      }

      if (parsed.action === 'quote') {
        setStep('COMPLETE');
        pushOutputLog('success', 'INTENT quote completed');
        return;
      }

      setStep('CONFIRMING');
      pushOutputLog('info', 'INTENT parsed and quoted; awaiting execution confirmation');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setStep(null);
    } finally {
      setInFlight(false);
    }
  };

  const executePipeline = async () => {
    if (!intent || intent.action !== 'swap') {
      setError('Current intent is quote-only and cannot be executed.');
      return;
    }

    if (!walletClient || !publicClient || !address || !isConnected) {
      setError('Connect wallet to execute intent.');
      return;
    }

    setInFlight(true);
    setError(null);
    setStep('EXECUTING');

    try {
      if (intent.gasless) {
        const quote = await service.getGaslessQuote({
          chainId: intent.chainId,
          sellToken: intent.sellToken,
          buyToken: intent.buyToken,
          amount: intent.amount,
          slippagePct: intent.slippageBps / 100,
          taker: address,
          executable: true,
        });

        if (quote.response.approval?.isRequired) {
          const approvalHash = await walletClient.sendTransaction({
            account: walletClient.account ?? undefined,
            chain: walletClient.chain,
            to: quote.response.approval.to,
            data: quote.response.approval.data,
            value: BigInt(quote.response.approval.value),
          });
          await publicClient.waitForTransactionReceipt({ hash: approvalHash });
        }

        const permit2Signature = await walletClient.signTypedData({
          account: walletClient.account ?? undefined,
          domain: quote.response.permit2.eip712.domain,
          types: toViemTypedDataTypes(quote.response.permit2.eip712.types),
          primaryType: quote.response.permit2.eip712.primaryType,
          message: quote.response.permit2.eip712.message,
        });

        const submit = await service.submitGaslessTrade({
          chainId: intent.chainId,
          tradeHash: quote.response.trade.hash,
          permit2Signature,
        });

        const txId = addTransaction({
          hash: submit.tradeHash,
          type: 'GASLESS',
          pair: `${intent.sellToken}/${intent.buyToken}`,
          amount: intent.amount,
          status: 'PENDING',
        });

        const finalStatus = await pollGaslessStatus(service, submit.tradeHash);
        const status = finalStatus.state.toUpperCase();
        if (status === 'CONFIRMED') {
          updateTransactionStatus(txId, 'CONFIRMED');
        } else if (status === 'FAILED') {
          updateTransactionStatus(txId, 'FAILED');
        }

        const chainHash = finalStatus.transactions?.find((transaction) => transaction.hash)?.hash;
        setExecutionHash(chainHash ?? submit.tradeHash);
      } else {
        const quote = await service.getSwapQuote({
          chainId: intent.chainId,
          sellToken: intent.sellToken,
          buyToken: intent.buyToken,
          amount: intent.amount,
          slippagePct: intent.slippageBps / 100,
          taker: address,
          executable: true,
        });

        if (quote.response.issues.allowance && !quote.resolvedSellToken.isNative) {
          const tokenAddress = quote.resolvedSellToken.addressOrSymbol;
          if (!isAddress(tokenAddress)) {
            throw new Error('Invalid approval token address');
          }

          await approveTokenUnlimited(walletClient, tokenAddress, quote.response.issues.allowance.spender);
        }

        const txHash = await executeSwapQuote(walletClient, publicClient, quote.response);
        const txId = addTransaction({
          hash: txHash,
          type: 'SWAP',
          pair: `${intent.sellToken}/${intent.buyToken}`,
          amount: intent.amount,
          status: 'PENDING',
        });

        await publicClient.waitForTransactionReceipt({ hash: txHash });
        updateTransactionStatus(txId, 'CONFIRMED');
        setExecutionHash(txHash);
      }

      setStep('COMPLETE');
      setSuccessMessage('INTENT EXECUTION COMPLETE');
      pushOutputLog('success', 'INTENT execution completed');
      window.setTimeout(() => setSuccessMessage(null), 5_000);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setStep('CONFIRMING');
    } finally {
      setInFlight(false);
    }
  };

  return {
    chainId,
    intentInput,
    placeholder,
    step,
    intent,
    swapQuote,
    gaslessQuote,
    executionHash,
    error,
    setIntentInput,
    runPipeline,
    executePipeline,
  };
}

/**
 * Polls gasless trade status until completion or timeout.
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
