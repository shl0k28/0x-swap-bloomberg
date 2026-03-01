import { Box, Flex, Text } from '@chakra-ui/react';
import { RouteVisualizer } from '@/components/route/RouteVisualizer';
import { useAppStore } from '@/stores/appStore';
import { toTimeAgo } from '@/utils/time';

/**
 * Bottom panel combines route visualizer and terminal output log.
 */
export function BottomPanel() {
  const snapshot = useAppStore((state) => state.quoteSnapshot);
  const outputLogs = useAppStore((state) => state.outputLogs);
  const routeHeight = snapshot && snapshot.route.fills.length > 4 ? 150 : 120;

  return (
    <Flex h={`${routeHeight + 68}px`} direction="column" bg="bgBase">
      <Box px={3} py={1.5} borderBottom="1px solid" borderColor="border">
        <Text
          fontFamily="mono"
          fontSize="9px"
          letterSpacing="0.15em"
          textTransform="uppercase"
          color="textDim"
        >
          ROUTE VISUALIZER
        </Text>
      </Box>

      <Box h={`${routeHeight}px`}>
        <RouteVisualizer snapshot={snapshot} />
      </Box>

      <Box
        h="40px"
        borderTop="1px solid"
        borderColor="border"
        px={3}
        py={1.5}
        overflowY="auto"
      >
        <Text
          fontFamily="mono"
          fontSize="9px"
          letterSpacing="0.15em"
          textTransform="uppercase"
          color="textDim"
          mb={1}
        >
          OUTPUT LOG
        </Text>
        {outputLogs.length === 0 ? (
          <Text fontSize="10px" color="textDim" fontFamily="mono" fontStyle="italic">
            no terminal output yet
          </Text>
        ) : null}
        {outputLogs.map((line) => (
          <Text
            key={line.id}
            fontSize="10px"
            fontFamily="mono"
            color={
              line.level === 'success'
                ? 'green'
                : line.level === 'error'
                  ? 'red'
                  : 'textSecondary'
            }
          >
            [{toTimeAgo(line.timestamp)}] {line.text}
          </Text>
        ))}
      </Box>
    </Flex>
  );
}
