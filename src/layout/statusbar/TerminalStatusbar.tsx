import { Box, Flex, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { springConfig } from '@/animations';
import { CHAIN_METADATA } from '@/constants/chains';
import { useAppStore } from '@/stores/appStore';
import { useStatusStore } from '@/stores/statusStore';
import { toTimeAgo } from '@/utils/time';

const MotionBox = motion(Box);

/**
 * Fixed statusbar with chain metrics and API telemetry.
 */
export function TerminalStatusbar() {
  const chainId = useAppStore((state) => state.selectedChainId);
  const { blockNumber, gasGwei, apiOnline, apiLatencyMs, lastUpdatedAt, apiRequestInFlight } =
    useStatusStore();

  const chainName = CHAIN_METADATA[chainId as keyof typeof CHAIN_METADATA]?.shortName ?? 'CHAIN';

  return (
    <Flex
      h="24px"
      align="center"
      justify="space-between"
      px={3}
      bg="bgBase"
      borderTop="1px solid"
      borderColor="border"
      fontSize="9px"
      fontFamily="mono"
      color="textDim"
      overflow="hidden"
      whiteSpace="nowrap"
    >
      <Flex align="center" minW={0}>
        <Box w="6px" h="6px" borderRadius="50%" bg={apiOnline ? 'green' : 'red'} mr={1.5} />
        <Text>{chainName.toUpperCase()}</Text>
        <Text mx={2}>│</Text>
        <Text>Block #{blockNumber}</Text>
        <Text mx={2}>│</Text>
        <Text>Gas: {gasGwei} gwei</Text>
      </Flex>

      <Flex align="center" minW={0} display={{ base: 'none', md: 'flex' }}>
        <Text>0x API:</Text>
        <MotionBox
          as="span"
          w="6px"
          h="6px"
          borderRadius="50%"
          ml={1}
          display="inline-block"
          bg={apiRequestInFlight ? 'amber' : apiOnline ? 'green' : 'red'}
          animate={apiRequestInFlight ? { scale: [0.85, 1] } : { scale: 1 }}
          transition={
            apiRequestInFlight
              ? { ...springConfig.gentle, repeat: Infinity, repeatType: 'reverse', duration: 0.8 }
              : springConfig.gentle
          }
        />
        <Text ml={1}>{apiOnline ? 'ONLINE' : 'OFFLINE'}</Text>
        <Text mx={2}>│</Text>
        <Text>Latency: {apiLatencyMs}ms</Text>
        <Text mx={2}>│</Text>
        <Text>Updated: {toTimeAgo(lastUpdatedAt)}</Text>
      </Flex>
    </Flex>
  );
}
