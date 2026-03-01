import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ZeroExRoute } from '@/types/zeroex';

/**
 * Supported tab ids in the main panel.
 */
export type TerminalTab = 'swap' | 'intent' | 'quotes' | 'gasless';

/**
 * Shared draft state for swap-like forms.
 */
export interface TradeDraft {
  sellToken: string;
  buyToken: string;
  amount: string;
  slippagePct: string;
  deadlineMinutes: string;
}

/**
 * Snapshot of last quote used by route visualizer and logs.
 */
export interface QuoteSnapshot {
  id: string;
  mode: TerminalTab;
  pairLabel: string;
  route: ZeroExRoute;
  buyAmount: string;
  sellAmount: string;
  buySymbol: string;
  sellSymbol: string;
  timestamp: number;
}

/**
 * Terminal output log line.
 */
export interface OutputLogLine {
  id: string;
  level: 'info' | 'error' | 'success';
  text: string;
  timestamp: number;
}

/**
 * Global UI/session store.
 */
export interface AppStoreState {
  activeTab: TerminalTab;
  selectedChainId: number;
  swapDraft: TradeDraft;
  quotesDraft: TradeDraft;
  gaslessDraft: TradeDraft;
  intentInput: string;
  quoteSnapshot: QuoteSnapshot | null;
  outputLogs: OutputLogLine[];
  commandPaletteOpen: boolean;
  successMessage: string | null;
  setActiveTab: (tab: TerminalTab) => void;
  setSelectedChainId: (chainId: number) => void;
  updateSwapDraft: (partial: Partial<TradeDraft>) => void;
  updateQuotesDraft: (partial: Partial<TradeDraft>) => void;
  updateGaslessDraft: (partial: Partial<TradeDraft>) => void;
  setIntentInput: (value: string) => void;
  applyQuickToken: (symbol: string) => void;
  setQuoteSnapshot: (snapshot: QuoteSnapshot | null) => void;
  pushOutputLog: (level: OutputLogLine['level'], text: string) => void;
  clearOutputLogs: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSuccessMessage: (message: string | null) => void;
}

const defaultDraft: TradeDraft = {
  sellToken: 'ETH',
  buyToken: 'USDC',
  amount: '1',
  slippagePct: '0.5',
  deadlineMinutes: '20',
};

/**
 * Shared app state persisted for recruiter review continuity.
 */
export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => ({
      activeTab: 'swap',
      selectedChainId: 8453,
      swapDraft: defaultDraft,
      quotesDraft: defaultDraft,
      gaslessDraft: { ...defaultDraft, amount: '100' },
      intentInput: 'swap 1 ETH for USDC on Base with 0.5% slippage',
      quoteSnapshot: null,
      outputLogs: [],
      commandPaletteOpen: false,
      successMessage: null,
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedChainId: (chainId) => set({ selectedChainId: chainId }),
      updateSwapDraft: (partial) => set({ swapDraft: { ...get().swapDraft, ...partial } }),
      updateQuotesDraft: (partial) => set({ quotesDraft: { ...get().quotesDraft, ...partial } }),
      updateGaslessDraft: (partial) => set({ gaslessDraft: { ...get().gaslessDraft, ...partial } }),
      setIntentInput: (value) => set({ intentInput: value }),
      applyQuickToken: (symbol) => {
        const activeTab = get().activeTab;
        if (activeTab === 'swap') {
          set({ swapDraft: { ...get().swapDraft, sellToken: symbol } });
          return;
        }

        if (activeTab === 'quotes') {
          set({ quotesDraft: { ...get().quotesDraft, sellToken: symbol } });
          return;
        }

        if (activeTab === 'gasless') {
          set({ gaslessDraft: { ...get().gaslessDraft, sellToken: symbol } });
        }
      },
      setQuoteSnapshot: (snapshot) => set({ quoteSnapshot: snapshot }),
      pushOutputLog: (level, text) => {
        const line: OutputLogLine = {
          id: crypto.randomUUID(),
          level,
          text,
          timestamp: Date.now(),
        };

        set({ outputLogs: [line, ...get().outputLogs].slice(0, 80) });
      },
      clearOutputLogs: () => set({ outputLogs: [] }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setSuccessMessage: (message) => set({ successMessage: message }),
    }),
    {
      name: 'matcha-ai-app-store-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeTab: state.activeTab,
        selectedChainId: state.selectedChainId,
        swapDraft: state.swapDraft,
        quotesDraft: state.quotesDraft,
        gaslessDraft: state.gaslessDraft,
        intentInput: state.intentInput,
      }),
    },
  ),
);
