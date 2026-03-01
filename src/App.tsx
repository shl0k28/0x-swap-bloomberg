import { Box, Center, Text } from '@chakra-ui/react';
import { useMemo } from 'react';
import { TerminalShell } from '@/layout/TerminalShell';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useStatusPolling } from '@/hooks/useStatusPolling';
import { loadBrowserRuntimeConfig } from '@/config/browserRuntime';

/**
 * Root app component for the Bloomberg-style trading terminal.
 */
export default function App() {
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

  if (runtimeError) {
    return (
      <Center h="100%">
        <Box bg="bgBase" border="1px solid" borderColor="border" p={6}>
          <Text fontFamily="mono" color="red" fontSize="12px">
            [ERROR] {runtimeError}
          </Text>
        </Box>
      </Center>
    );
  }

  return <TerminalShell />;
}
