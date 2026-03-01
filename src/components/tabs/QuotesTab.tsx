import { Button, Flex, HStack, Input, Switch, Text } from '@chakra-ui/react';
import { useAccount } from 'wagmi';
import { TokenSelector } from '@/components/common/TokenSelector';
import { TerminalErrorLine } from '@/components/common/TerminalErrorLine';
import { QuotesComparePanel } from '@/components/tabs/QuotesComparePanel';
import { QuotesSummaryCard } from '@/components/tabs/QuotesSummaryCard';
import { useQuotesTabController } from '@/hooks/useQuotesTabController';
import { useAppStore } from '@/stores/appStore';

/**
 * Quote-only intelligence panel with compare and auto-refresh modes.
 */
export function QuotesTab() {
  const chainId = useAppStore((state) => state.selectedChainId);
  const { address } = useAccount();
  const {
    draft,
    quote,
    error,
    compareCsv,
    compareRows,
    autoRefresh,
    deltaPct,
    isLoadingQuote,
    isCompareLoading,
    quoteFetchedAt,
    updateDraft,
    setCompareCsv,
    setAutoRefresh,
    fetchQuote,
    runCompare,
  } = useQuotesTabController();

  return (
    <Flex direction="column" p={3} gap={3} h="100%" overflowY="auto" alignItems="flex-start">
      <HStack spacing={2} align="center" w="full" maxW="640px" flexWrap="wrap">
        <TokenSelector
          chainId={chainId}
          value={draft.sellToken}
          onChange={(sellToken) => updateDraft({ sellToken })}
          walletAddress={address}
          triggerButtonProps={{ flex: 1, maxW: '220px' }}
        />
        <TokenSelector
          chainId={chainId}
          value={draft.buyToken}
          onChange={(buyToken) => updateDraft({ buyToken })}
          walletAddress={address}
          triggerButtonProps={{ flex: 1, maxW: '220px' }}
        />
        <Input
          h="36px"
          value={draft.amount}
          onChange={(event) => updateDraft({ amount: event.target.value })}
          bg="bgSurface"
          border="1px solid"
          borderColor="borderBright"
          borderRadius="2px"
          fontFamily="mono"
          fontSize="12px"
          w={{ base: '120px', md: '140px' }}
        />
        <Button
          h="36px"
          bg="amber"
          color="bgVoid"
          fontFamily="mono"
          fontSize="10px"
          textTransform="uppercase"
          letterSpacing="0.1em"
          onClick={() => void fetchQuote()}
        >
          {isLoadingQuote ? 'Fetching' : 'Fetch Quote'}
        </Button>
      </HStack>

      <Flex align="center" justify="space-between">
        <HStack spacing={2}>
          <Switch
            colorScheme="yellow"
            isChecked={autoRefresh}
            onChange={(event) => setAutoRefresh(event.target.checked)}
          />
          <Text fontFamily="mono" fontSize="9px" color="textDim" letterSpacing="0.12em">
            AUTO-REFRESH 15s
          </Text>
        </HStack>
        <Text fontFamily="mono" fontSize="12px" color={deltaPct >= 0 ? 'green' : 'red'}>
          Δ {deltaPct.toFixed(3)}%
        </Text>
      </Flex>

      {error ? <TerminalErrorLine message={error} /> : null}

      <QuotesSummaryCard quote={quote} fetchedAt={quoteFetchedAt} loading={isLoadingQuote} />

      <QuotesComparePanel
        compareCsv={compareCsv}
        compareRows={compareRows}
        isLoading={isCompareLoading}
        onChangeCompareCsv={setCompareCsv}
        onRunCompare={runCompare}
      />
    </Flex>
  );
}
