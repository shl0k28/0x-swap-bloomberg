import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrum, base, mainnet, polygon } from 'wagmi/chains';
import { http } from 'wagmi';

/**
 * WalletConnect project id for RainbowKit connectors.
 */
const walletConnectProjectId =
  (import.meta.env['VITE_WALLETCONNECT_PROJECT_ID'] as string | undefined) ?? 'matcha-ai-local';

/**
 * Supported chains in the terminal UI.
 */
export const terminalChains = [mainnet, base, arbitrum, polygon] as const;

/**
 * wagmi configuration consumed by RainbowKit and hooks.
 */
export const wagmiConfig = getDefaultConfig({
  appName: 'matcha-ai',
  projectId: walletConnectProjectId,
  chains: terminalChains,
  transports: {
    [mainnet.id]: http(import.meta.env['VITE_RPC_URL_MAINNET'] as string | undefined),
    [base.id]: http(import.meta.env['VITE_RPC_URL_BASE'] as string | undefined),
    [arbitrum.id]: http(import.meta.env['VITE_RPC_URL_ARBITRUM'] as string | undefined),
    [polygon.id]: http(import.meta.env['VITE_RPC_URL_POLYGON'] as string | undefined),
  },
  ssr: false,
});
