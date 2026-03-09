import type { PropsWithChildren } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { css, Global } from '@emotion/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RainbowKitProvider,
  cssStringFromTheme,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { terminalTheme } from '@/design/theme';
import { wagmiConfig } from '@/wallet/wagmiConfig';
import '@rainbow-me/rainbowkit/styles.css';

/**
 * Shared query client for API polling and quote requests.
 */
const queryClient = new QueryClient();

const rainbowTheme = darkTheme({
  accentColor: '#f5a623',
  accentColorForeground: '#08080d',
  borderRadius: 'none',
  fontStack: 'system',
  overlayBlur: 'none',
});

const rainbowThemeCss = cssStringFromTheme(rainbowTheme);

const rainbowkitOverrides = css`
  [data-rk] {
    ${rainbowThemeCss}
  }

  [data-rk] [role='dialog'] {
    background: var(--chakra-colors-bgBase) !important;
    border: 1px solid var(--chakra-colors-borderBright) !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }

  [data-rk] [role='dialog'] * {
    box-shadow: none !important;
  }

  [data-rk] [data-testid='rk-connect-modal-overlay'] {
    backdrop-filter: none !important;
    background: rgba(8, 8, 13, 0.92) !important;
  }

  [data-rk] [role='dialog'] h1,
  [data-rk] [role='dialog'] h2,
  [data-rk] [role='dialog'] h3 {
    font-family: 'Iosevka Aile', 'Iosevka', sans-serif !important;
    letter-spacing: 0.15em !important;
    text-transform: uppercase !important;
    font-size: 9px !important;
    color: var(--chakra-colors-textDim) !important;
  }

  [data-rk] [role='dialog'] button {
    border-radius: 0 !important;
    font-family: 'Iosevka Fixed', 'Iosevka', monospace !important;
  }

  [data-rk] [role='dialog'] [aria-label='Close'] {
    color: var(--chakra-colors-textDim) !important;
  }

  [data-rk] [role='dialog'] [aria-label='Close']:hover {
    color: var(--chakra-colors-textPrimary) !important;
  }

  [data-rk] [role='dialog'] [aria-label*='Wallet'],
  [data-rk] [role='dialog'] [aria-label*='wallet'] {
    border-bottom: 1px solid var(--chakra-colors-border) !important;
    border-radius: 0 !important;
    min-height: 40px !important;
  }

  [data-rk] [role='dialog'] [aria-label*='Wallet']:hover,
  [data-rk] [role='dialog'] [aria-label*='wallet']:hover {
    background: var(--chakra-colors-bgSurface) !important;
  }

  @media (max-width: 48em) {
    [data-rk] [role='dialog'] > div > div:last-of-type {
      display: none !important;
    }
  }
`;

const globalFocusOverrides = css`
  *:focus,
  *:focus-visible,
  *:focus-within {
    outline: none !important;
    box-shadow: none !important;
  }

  input:focus,
  input:focus-visible,
  textarea:focus,
  textarea:focus-visible {
    border-color: var(--chakra-colors-amberDim) !important;
    box-shadow: none !important;
  }
`;

/**
 * Top-level provider stack for terminal UI.
 */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={terminalTheme}>
          <Global styles={rainbowkitOverrides} />
          <Global styles={globalFocusOverrides} />
          <RainbowKitProvider coolMode={false} theme={rainbowTheme}>
            {children}
          </RainbowKitProvider>
        </ChakraProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
