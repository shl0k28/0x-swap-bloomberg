import { Box, Flex, Text } from '@chakra-ui/react';
import { ChainSelector } from '@/layout/topbar/ChainSelector';
import { WalletBar } from '@/layout/topbar/WalletBar';

/**
 * Terminal topbar with logo, chain selector, and wallet controls.
 */
export function TerminalTopbar() {
  return (
    <Flex
      h="44px"
      align="center"
      justify="space-between"
      px={3}
      borderBottom="1px solid"
      borderColor="border"
      bg="bgBase"
      overflow="hidden"
    >
      <Box minW={0}>
        <Text textStyle="heroTitle" fontSize="16px" whiteSpace="nowrap">
          valence
        </Text>
        <Text
          display={{ base: 'none', md: 'block' }}
          fontSize="10px"
          color="textDim"
          fontFamily="mono"
          lineHeight="1"
          whiteSpace="nowrap"
        >
          prompt to intent to 0x route to execution
        </Text>
      </Box>

      <Flex align="center" gap={2}>
        <Box display={{ base: 'none', md: 'block' }}>
          <ChainSelector />
        </Box>
        <WalletBar />
      </Flex>
    </Flex>
  );
}
