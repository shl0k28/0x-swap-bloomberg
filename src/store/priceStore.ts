import { create } from 'zustand';
import type { PythSymbol } from '@/constants/pythFeeds';

export interface PriceEntry {
  price: number;
  delta: number;
  updatedAt: number;
  flash: boolean;
}

export type PriceConnectionStatus = 'idle' | 'connecting' | 'online' | 'error';

interface PriceStore {
  prices: Record<PythSymbol, PriceEntry | undefined>;
  connectionStatus: PriceConnectionStatus;
  setPrice: (symbol: PythSymbol, entry: PriceEntry) => void;
  setConnectionStatus: (status: PriceConnectionStatus) => void;
}

/**
 * Live Pyth price store shared across all UI consumers.
 */
export const usePriceStore = create<PriceStore>((set) => ({
  prices: {
    ETH: undefined,
    BTC: undefined,
    SOL: undefined,
    USDT: undefined,
  },
  connectionStatus: 'idle',
  setPrice: (symbol, entry) =>
    set((state) => ({
      prices: {
        ...state.prices,
        [symbol]: entry,
      },
    })),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
}));
