import { useEffect, useMemo } from 'react';
import { formatUnits } from 'viem';
import { usePublicClient } from 'wagmi';
import { loadBrowserRuntimeConfig } from '@/config/browserRuntime';
import { ZeroxService } from '@/services/zerox/zeroxService';
import { useAppStore } from '@/stores/appStore';
import { useStatusStore } from '@/stores/statusStore';
import { useTakerAddress } from '@/hooks/useTakerAddress';

/**
 * Polls chain and API telemetry for the status bar.
 */
export function useStatusPolling(enabled = true) {
  const chainId = useAppStore((state) => state.selectedChainId);
  const taker = useTakerAddress();
  const service = useMemo(() => {
    try {
      return new ZeroxService(loadBrowserRuntimeConfig());
    } catch {
      return null;
    }
  }, []);
  const publicClient = usePublicClient({ chainId });
  const setChainMetrics = useStatusStore((state) => state.setChainMetrics);
  const setApiStatus = useStatusStore((state) => state.setApiStatus);

  useEffect(() => {
    if (!enabled || !service) {
      setApiStatus(false, 0);
      return;
    }

    let disposed = false;

    const poll = async () => {
      if (!publicClient || disposed) {
        return;
      }

      try {
        const [blockNumber, gasPrice, apiPing] = await Promise.all([
          publicClient.getBlockNumber(),
          publicClient.getGasPrice(),
          service.pingApi(chainId, taker),
        ]);

        if (disposed) {
          return;
        }

        setChainMetrics(blockNumber.toString(), Number(formatUnits(gasPrice, 9)).toFixed(1));
        setApiStatus(apiPing.online, apiPing.latencyMs);
      } catch {
        if (!disposed) {
          setApiStatus(false, 0);
        }
      }
    };

    void poll();
    const handle = window.setInterval(() => {
      void poll();
    }, 10_000);

    return () => {
      disposed = true;
      window.clearInterval(handle);
    };
  }, [chainId, enabled, publicClient, service, setApiStatus, setChainMetrics, taker]);
}
