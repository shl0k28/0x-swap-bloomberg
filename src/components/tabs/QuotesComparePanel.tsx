import { Box, Button, Flex, Input, Text } from '@chakra-ui/react';
import { formatUnits } from 'viem';
import type { SwapQuoteEnvelope } from '@/services/zerox/types';
import { BrailleSpinner } from '@/components/common/BrailleSpinner';

/**
 * Compare-mode panel for fetching and rendering multi-amount quote ladders.
 */
export function QuotesComparePanel({
  compareCsv,
  compareRows,
  isLoading,
  onChangeCompareCsv,
  onRunCompare,
}: {
  compareCsv: string;
  compareRows: SwapQuoteEnvelope[];
  isLoading: boolean;
  onChangeCompareCsv: (value: string) => void;
  onRunCompare: () => Promise<void>;
}) {
  return (
    <Box bg="bgSurface" border="1px solid" borderColor="border" p={2} maxW="480px" w="full">
      <Text
        fontFamily="mono"
        fontSize="9px"
        letterSpacing="0.12em"
        textTransform="uppercase"
        color="textDim"
        mb={2}
      >
        Compare amounts (comma-separated)
      </Text>

      <Flex align="center" gap={2} mb={2}>
        <Input
          h="36px"
          value={compareCsv}
          onChange={(event) => onChangeCompareCsv(event.target.value)}
          borderRadius="2px"
          bg="bgSurface"
          border="1px solid"
          borderColor="borderBright"
          fontFamily="mono"
          fontSize="12px"
          color="textPrimary"
          placeholder="0.1, 1, 5, 10"
          _placeholder={{ color: 'textDim' }}
          _focusVisible={{ borderColor: 'amberDim', boxShadow: 'none' }}
        />
        <Button
          h="32px"
          variant="outline"
          borderColor="borderBright"
          color="textSecondary"
          fontSize="10px"
          fontFamily="mono"
          _hover={{ borderColor: 'amber', color: 'amber' }}
          onClick={() => void onRunCompare()}
        >
          {isLoading ? <BrailleSpinner label="compare" /> : 'Compare'}
        </Button>
      </Flex>

      {compareRows.length === 0 ? (
        <Text fontFamily="mono" fontSize="10px" color="textDim">
          no compare rows yet
        </Text>
      ) : null}

      <Flex direction="column" mt={1}>
        <Flex py={1} borderBottom="1px solid" borderColor="border">
          <Text fontFamily="mono" fontSize="10px" color="textDim" w="33%">
            AMOUNT IN
          </Text>
          <Text fontFamily="mono" fontSize="10px" color="textDim" w="33%" textAlign="right">
            BUY AMOUNT
          </Text>
          <Text fontFamily="mono" fontSize="10px" color="textDim" w="34%" textAlign="right">
            IMPACT
          </Text>
        </Flex>

        {compareRows.map((row, index) => (
          <Flex key={`${row.sellAmountBaseUnits}-${index}`} py={1} borderBottom="1px solid" borderColor="border">
            <Text fontFamily="mono" fontSize="10px" color="textPrimary" w="33%">
              {row.request.amount}
            </Text>
            <Text fontFamily="mono" fontSize="10px" color="textPrimary" w="33%" textAlign="right">
              {Number(
                formatUnits(BigInt(row.response.buyAmount), row.resolvedBuyToken.decimals),
              ).toLocaleString('en-US', { maximumFractionDigits: 6 })}
            </Text>
            <Text
              fontFamily="mono"
              fontSize="10px"
              color={row.priceImpactPct >= 1 ? 'amber' : 'textSecondary'}
              w="34%"
              textAlign="right"
            >
              {row.priceImpactPct.toFixed(3)}%
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
}
