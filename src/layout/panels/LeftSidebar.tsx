import { Box, Flex } from '@chakra-ui/react';
import { PriceTickerPanel } from '@/components/left/PriceTickerPanel';
import { TokenQuickSelectPanel } from '@/components/left/TokenQuickSelectPanel';
import { RecentIntentsPanel } from '@/components/left/RecentIntentsPanel';
import { TxHistoryPanel } from '@/components/left/TxHistoryPanel';

/**
 * Fixed-density left sidebar containing market and history widgets.
 */
export function LeftSidebar() {
  return (
    <Flex direction="column" h="100%" p={2} gap={2} overflow="hidden">
      <Box flexShrink={0}>
        <PriceTickerPanel />
      </Box>
      <Box flexShrink={0}>
        <TokenQuickSelectPanel />
      </Box>
      <Box flex="1" minH={0} overflow="hidden">
        <RecentIntentsPanel />
      </Box>
      <Box flexShrink={0} maxH="120px" overflow="hidden">
        <TxHistoryPanel />
      </Box>
    </Flex>
  );
}
