import { Box, Flex, Text } from '@chakra-ui/react';
import type { GaslessQuoteEnvelope } from '@/services/zerox/types';

/**
 * Fee section for gasless quotes.
 */
export function GaslessFeeBreakdown({ quote }: { quote: GaslessQuoteEnvelope | null }) {
  if (!quote) {
    return null;
  }

  const feeEntries = Object.entries(quote.response.fees ?? {});
  const protocolFee = feeEntries.find(([key]) => key.toLowerCase().includes('protocol'));
  const gasFee = feeEntries.find(([key]) => key.toLowerCase().includes('gas'));

  return (
    <Box>
      <Flex justify="space-between" fontFamily="mono" fontSize="10px" py={0.5}>
        <Text color="textDim">PROTOCOL FEE</Text>
        <Text color="textPrimary">
          {protocolFee
            ? typeof protocolFee[1] === 'string'
              ? protocolFee[1]
              : JSON.stringify(protocolFee[1])
            : '-'}
        </Text>
      </Flex>

      <Flex justify="space-between" fontFamily="mono" fontSize="10px" py={0.5}>
        <Text color="textDim">GAS FEE</Text>
        <Text color="textPrimary">
          {gasFee
            ? typeof gasFee[1] === 'string'
              ? `${gasFee[1]} deducted from sell`
              : `${JSON.stringify(gasFee[1])} deducted from sell`
            : '~$0 deducted from sell'}
        </Text>
      </Flex>
    </Box>
  );
}
