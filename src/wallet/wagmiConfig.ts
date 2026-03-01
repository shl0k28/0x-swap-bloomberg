import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { arbitrum, base, mainnet, polygon } from 'wagmi/chains';

/**
 * WalletConnect project id for RainbowKit connectors.
 */
const walletConnectProjectId =
  (import.meta.env['VITE_WALLETCONNECT_PROJECT_ID'] as string | undefined) ?? '';

/**
 * Supported chains in the terminal UI.
 */
export const terminalChains = [mainnet, base, arbitrum, polygon] as const;

const transports = {
  [mainnet.id]: http(import.meta.env['VITE_RPC_URL_MAINNET'] as string | undefined),
  [base.id]: http(import.meta.env['VITE_RPC_URL_BASE'] as string | undefined),
  [arbitrum.id]: http(import.meta.env['VITE_RPC_URL_ARBITRUM'] as string | undefined),
  [polygon.id]: http(import.meta.env['VITE_RPC_URL_POLYGON'] as string | undefined),
} as const;

/**
 * Validates WalletConnect Cloud project-id format (32-char hex).
 */
function isValidWalletConnectProjectId(value: string): boolean {
  return /^[a-fA-F0-9]{32}$/.test(value);
}

/**
 * wagmi configuration consumed by RainbowKit and hooks.
 * Falls back to injected-only connectors when WalletConnect projectId is invalid.
 */
export const wagmiConfig = isValidWalletConnectProjectId(walletConnectProjectId)
  ? getDefaultConfig({
      appName: 'matcha-ai',
      projectId: walletConnectProjectId,
      chains: terminalChains,
      transports,
      ssr: false,
    })
  : createConfig({
      chains: terminalChains,
      connectors: [injected()],
      transports,
      ssr: false,
    });
