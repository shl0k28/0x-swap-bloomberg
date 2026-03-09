import { useEffect, useMemo } from 'react';
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
  const setApiStatus = useStatusStore((state) => state.setApiStatus);

  useEffect(() => {
    if (!enabled || !service) {
      setApiStatus(false, 0);
      return;
    }

    let disposed = false;

    const poll = async () => {
      if (disposed) {
        return;
      }

      try {
        const apiPing = await service.pingApi(chainId, taker);

        if (disposed) {
          return;
        }

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
  }, [chainId, enabled, service, setApiStatus, taker]);
}
