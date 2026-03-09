import { Box, Center, Text } from '@chakra-ui/react';
import { useEffect, useMemo } from 'react';
import { TerminalShell } from '@/layout/TerminalShell';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { usePythPrices } from '@/hooks/usePythPrices';
import { useStatusPolling } from '@/hooks/useStatusPolling';
import { loadBrowserRuntimeConfig } from '@/config/browserRuntime';
import { fetchTokenListForChain } from '@/services/tokenListService';
import { useAppStore } from '@/stores/appStore';

/**
 * Root app component for the Bloomberg-style trading terminal.
 */
export default function App() {
  const chainId = useAppStore((state) => state.selectedChainId);
  useKeyboardShortcuts();
  const runtimeError = useMemo(() => {
    try {
      loadBrowserRuntimeConfig();
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'Runtime config missing';
    }
  }, []);
  useStatusPolling(runtimeError === null);
  usePythPrices(runtimeError === null, chainId);

  useEffect(() => {
    if (runtimeError !== null) {
      return;
    }

    void fetchTokenListForChain(chainId).catch(() => undefined);
  }, [chainId, runtimeError]);

  if (runtimeError) {
    return (
      <Center h="100vh">
        <Box bg="bgBase" border="1px solid" borderColor="border" p={6}>
          <Text fontFamily="mono" color="red" fontSize="12px">
            [ERROR] {runtimeError}
          </Text>
        </Box>
      </Center>
    );
  }

  return (
    <Box h="100vh" display="flex" flexDir="column" overflow="hidden">
      <TerminalShell />
    </Box>
  );
}
