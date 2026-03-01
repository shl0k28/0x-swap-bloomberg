import { create } from 'zustand';

/**
 * API + chain telemetry shown in fixed terminal status bar.
 */
export interface StatusStoreState {
  blockNumber: string;
  gasGwei: string;
  apiOnline: boolean;
  apiLatencyMs: number;
  lastUpdatedAt: number;
  apiRequestInFlight: boolean;
  setChainMetrics: (blockNumber: string, gasGwei: string) => void;
  setApiStatus: (online: boolean, latencyMs: number) => void;
  setApiRequestInFlight: (inFlight: boolean) => void;
}

/**
 * Live status indicators for top-level telemetry.
 */
export const useStatusStore = create<StatusStoreState>((set) => ({
  blockNumber: '-',
  gasGwei: '-',
  apiOnline: false,
  apiLatencyMs: 0,
  lastUpdatedAt: Date.now(),
  apiRequestInFlight: false,
  setChainMetrics: (blockNumber, gasGwei) =>
    set({ blockNumber, gasGwei, lastUpdatedAt: Date.now() }),
  setApiStatus: (online, latencyMs) =>
    set({ apiOnline: online, apiLatencyMs: latencyMs, lastUpdatedAt: Date.now() }),
  setApiRequestInFlight: (inFlight) => set({ apiRequestInFlight: inFlight }),
}));
