import { Box, Flex, Grid, Skeleton, Text } from '@chakra-ui/react';
import { formatUnits } from 'viem';
import { CopyButton } from '@/components/common/CopyButton';
import type { SwapQuoteEnvelope } from '@/services/zerox/types';
import { toTimeAgo } from '@/utils/time';

/**
 * Quote snapshot table used in QUOTES mode.
 */
export function QuotesSummaryCard({
  quote,
  fetchedAt,
  loading,
}: {
  quote: SwapQuoteEnvelope | null;
  fetchedAt: number | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Box bg="bgSurface" border="1px solid" borderColor="border" p={2}>
        <Flex direction="column" gap={2}>
          {[1, 2, 3, 4, 5].map((row) => (
            <Skeleton key={row} h="20px" startColor="bgSurface" endColor="bgRaised" />
          ))}
        </Flex>
      </Box>
    );
  }

  if (!quote) {
    return null;
  }

  const sellReadable = formatUnits(
    BigInt(quote.response.sellAmount),
    quote.resolvedSellToken.decimals,
  );
  const buyReadable = formatUnits(BigInt(quote.response.buyAmount), quote.resolvedBuyToken.decimals);
  const price = Number(buyReadable) / Math.max(Number(sellReadable), 1e-9);
  const fetchedLabel = fetchedAt ? toTimeAgo(fetchedAt) : 'just now';

  return (
    <Box bg="bgSurface" border="1px solid" borderColor="border" p={2}>
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontFamily="mono" fontSize="10px" color="amber">
          QUOTE {quote.resolvedSellToken.symbol} {'->'} {quote.resolvedBuyToken.symbol} fetched {fetchedLabel}
        </Text>
        <CopyButton value={JSON.stringify(quote.response, null, 2)} />
      </Flex>

      <Grid templateColumns="180px 1fr">
        <QuoteGridRow label="SELL AMOUNT" value={`${sellReadable} ${quote.resolvedSellToken.symbol}`} />
        <QuoteGridRow label="BUY AMOUNT" value={`${buyReadable} ${quote.resolvedBuyToken.symbol}`} />
        <QuoteGridRow
          label="PRICE"
          value={`${price.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${quote.resolvedBuyToken.symbol}/${quote.resolvedSellToken.symbol}`}
        />
        <QuoteGridRow
          label="PRICE IMPACT"
          value={`${quote.priceImpactPct.toFixed(3)}%`}
          valueColor={
            quote.priceImpactPct < 1 ? 'green' : quote.priceImpactPct <= 5 ? 'amber' : 'red'
          }
        />
        <QuoteGridRow label="GAS ESTIMATE" value={`${quote.response.transaction.gas ?? '-'} units`} />
        <Box h="28px" display="flex" alignItems="center" borderBottom="1px solid" borderColor="border">
          <Text fontFamily="mono" fontSize="10px" color="textDim">
            SOURCES
          </Text>
        </Box>
        <Box py={1.5} borderBottom="1px solid" borderColor="border">
          <Flex direction="column" gap={1}>
            {quote.response.route.fills.map((fill, index) => (
              <Flex key={`${fill.source}-${index}`} align="center" gap={2}>
                <Text fontFamily="mono" fontSize="10px" color="textSecondary" minW="56px">
                  {fill.source}
                </Text>
                <Box flex="1" h="4px" bg="amberDim">
                  <Box h="4px" bg="amber" w={`${Math.min(100, Number(fill.proportionBps) / 100)}%`} />
                </Box>
                <Text fontFamily="mono" fontSize="10px" color="textPrimary" minW="44px" textAlign="right">
                  {(Number(fill.proportionBps) / 100).toFixed(2)}%
                </Text>
              </Flex>
            ))}
          </Flex>
        </Box>
      </Grid>
    </Box>
  );
}

function QuoteGridRow({
  label,
  value,
  valueColor = 'textPrimary',
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <>
      <Box h="28px" display="flex" alignItems="center" borderBottom="1px solid" borderColor="border">
        <Text fontFamily="mono" fontSize="10px" color="textDim">
          {label}
        </Text>
      </Box>
      <Box h="28px" display="flex" alignItems="center" borderBottom="1px solid" borderColor="border">
        <Text
          fontFamily="mono"
          fontSize="12px"
          color={valueColor}
          textAlign="right"
          noOfLines={1}
        >
          {value}
        </Text>
      </Box>
    </>
  );
}
