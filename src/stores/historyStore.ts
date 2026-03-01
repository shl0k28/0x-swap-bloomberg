import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Transaction lifecycle states rendered in left panel history.
 */
export type TxStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

/**
 * Minimal transaction history entry.
 */
export interface TxHistoryEntry {
  id: string;
  hash: string;
  type: 'SWAP' | 'GASLESS';
  pair: string;
  amount: string;
  status: TxStatus;
  createdAt: number;
}

/**
 * Store for intent and transaction history panels.
 */
export interface HistoryStoreState {
  recentIntents: string[];
  transactions: TxHistoryEntry[];
  addIntent: (text: string) => void;
  addTransaction: (entry: Omit<TxHistoryEntry, 'id' | 'createdAt'>) => string;
  updateTransactionStatus: (id: string, status: TxStatus) => void;
}

/**
 * Persisted history state for quick reruns and recruiter demos.
 */
export const useHistoryStore = create<HistoryStoreState>()(
  persist(
    (set, get) => ({
      recentIntents: [],
      transactions: [],
      addIntent: (text) => {
        const trimmed = text.trim();
        if (trimmed.length === 0) {
          return;
        }

        const next = [trimmed, ...get().recentIntents.filter((item) => item !== trimmed)].slice(0, 5);
        set({ recentIntents: next });
      },
      addTransaction: (entry) => {
        const id = crypto.randomUUID();
        const next: TxHistoryEntry = {
          id,
          createdAt: Date.now(),
          ...entry,
        };

        set({ transactions: [next, ...get().transactions].slice(0, 10) });
        return id;
      },
      updateTransactionStatus: (id, status) => {
        set({
          transactions: get().transactions.map((item) => (item.id === id ? { ...item, status } : item)),
        });
      },
    }),
    {
      name: 'matcha-ai-history-v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
