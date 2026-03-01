import { Box, Button, Flex, Link, Text, Textarea } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { BrailleSpinner } from '@/components/common/BrailleSpinner';
import { TerminalErrorLine } from '@/components/common/TerminalErrorLine';
import { IntentPipeline } from '@/components/tabs/IntentPipeline';
import { ParsedIntentViewer } from '@/components/tabs/ParsedIntentViewer';
import { useIntentTabController } from '@/hooks/useIntentTabController';
import { getExplorerTxUrl } from '@/utils/explorer';

const MotionText = motion(Text);

/**
 * Intent mode tab: natural language -> parsed intent -> quote -> execute.
 */
export function IntentTab() {
  const {
    chainId,
    intentInput,
    placeholder,
    step,
    intent,
    swapQuote,
    gaslessQuote,
    executionHash,
    error,
    setIntentInput,
    runPipeline,
    executePipeline,
  } = useIntentTabController();

  const quote = swapQuote ?? gaslessQuote;

  const previews = {
    PARSING: intent ? `${intent.amount} ${intent.sellToken} -> ${intent.buyToken}` : '',
    QUOTING: quote ? `${quote.response.buyAmount} out` : '',
    CONFIRMING: intent?.action === 'swap' ? 'awaiting user confirmation' : 'quote only',
    EXECUTING: executionHash ? executionHash.slice(0, 10) : 'pending tx',
    COMPLETE: quote ? 'completed' : '',
  } as const;

  return (
    <Flex direction="column" p={3} gap={3} h="100%" overflowY="auto">
      <Box position="relative">
        <Textarea
          value={intentInput}
          onChange={(event) => setIntentInput(event.target.value)}
          rows={6}
          borderRadius="2px"
          border="1px solid"
          borderColor="borderBright"
          bg="bgSurface"
          fontFamily="mono"
          fontSize="12px"
          color="textPrimary"
          px={3}
          py={2.5}
          minH="100px"
          _focusVisible={{ borderColor: 'amber', boxShadow: 'none' }}
          placeholder=""
        />
        <AnimatePresence mode="wait">
          {intentInput.length === 0 ? (
            <MotionText
              key={placeholder}
              position="absolute"
              top={3}
              left={3}
              right={3}
              fontFamily="mono"
              fontSize="12px"
              color="textDim"
              pointerEvents="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              noOfLines={2}
            >
              {placeholder}
            </MotionText>
          ) : null}
        </AnimatePresence>
      </Box>

      <Button
        h="44px"
        bg="amber"
        color="bgVoid"
        borderRadius="2px"
        fontFamily="mono"
        fontSize="11px"
        textTransform="uppercase"
        letterSpacing="0.1em"
        onClick={() => void runPipeline()}
      >
        RUN INTENT
      </Button>

      {step ? <IntentPipeline currentStep={step} previews={previews} /> : null}
      <ParsedIntentViewer intent={intent} />
      <IntentQuoteSummary quote={quote} />

      {step === 'CONFIRMING' && intent?.action === 'swap' ? (
        <Box bg="bgSurface" border="1px solid" borderColor="border" p={2}>
          <Text fontFamily="mono" color="amber" fontSize="10px" mb={2}>
            Confirm {intent.sellToken} {'->'} {intent.buyToken} ({intent.amount})
          </Text>
          <Button h="36px" bg="green" color="bgVoid" fontFamily="mono" fontSize="10px" onClick={() => void executePipeline()}>
            Confirm & Execute
          </Button>
        </Box>
      ) : null}

      {step === 'EXECUTING' ? <BrailleSpinner label="executing intent" /> : null}

      {executionHash ? (
        <Link href={getExplorerTxUrl(chainId, executionHash)} isExternal color="cyan" fontFamily="mono" fontSize="10px">
          tx: {executionHash.slice(0, 10)}...
        </Link>
      ) : null}

      {error ? <TerminalErrorLine message={error} /> : null}
    </Flex>
  );
}

function IntentQuoteSummary({
  quote,
}: {
  quote:
    | {
        resolvedSellToken: { symbol: string };
        resolvedBuyToken: { symbol: string };
        response: { sellAmount: string; buyAmount: string; route: { fills: Array<{ source: string }> } };
      }
    | null;
}) {
  if (!quote) {
    return null;
  }

  const sources = Array.from(new Set(quote.response.route.fills.map((fill) => fill.source))).join(' -> ');

  return (
    <Box bg="bgSurface" border="1px solid" borderColor="border" p={2}>
      <Text fontFamily="mono" color="amber" fontSize="10px" mb={1}>
        Quote Summary
      </Text>
      <Text fontFamily="mono" fontSize="10px" color="textSecondary">
        Sell: {quote.response.sellAmount} {quote.resolvedSellToken.symbol}
      </Text>
      <Text fontFamily="mono" fontSize="10px" color="textSecondary">
        Buy: {quote.response.buyAmount} {quote.resolvedBuyToken.symbol}
      </Text>
      <Text fontFamily="mono" fontSize="10px" color="cyan">
        Route: {sources || '-'}
      </Text>
    </Box>
  );
}
