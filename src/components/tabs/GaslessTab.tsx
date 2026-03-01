import { Box, Button, Flex, HStack, Input, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { buttonStateVariants, springConfig } from '@/animations';
import { BrailleSpinner } from '@/components/common/BrailleSpinner';
import { SlippageSelector } from '@/components/common/SlippageSelector';
import { TerminalErrorLine } from '@/components/common/TerminalErrorLine';
import { TokenSelector } from '@/components/common/TokenSelector';
import { GaslessFeeBreakdown } from '@/components/tabs/GaslessFeeBreakdown';
import { useGaslessTabController } from '@/hooks/useGaslessTabController';

const MotionButton = motion(Button);

/**
 * Gasless tab for EIP-712 signature-based meta-transaction swaps.
 */
export function GaslessTab() {
  const {
    chainId,
    draft,
    address,
    quote,
    eligible,
    eligibilityMessage,
    executionState,
    error,
    isQuoteLoading,
    updateDraft,
    fetchQuote,
    execute,
    executionStateLabel,
  } = useGaslessTabController();

  return (
    <Flex direction="column" p={3} gap={3} h="100%" overflowY="auto">
      <Text fontSize="12px" color="textSecondary" fontFamily="body">
        Trades executed without ETH for gas. Fees are deducted from the sell token.
      </Text>

      <HStack spacing={2} align="center">
        <TokenSelector
          chainId={chainId}
          value={draft.sellToken}
          onChange={(sellToken) => updateDraft({ sellToken })}
          walletAddress={address}
        />
        <TokenSelector
          chainId={chainId}
          value={draft.buyToken}
          onChange={(buyToken) => updateDraft({ buyToken })}
          walletAddress={address}
        />
        <EligibilityBadge eligible={eligible} />
      </HStack>

      <Text fontFamily="mono" fontSize="10px" color="textSecondary">
        {eligibilityMessage}
      </Text>

      <Input
        h="44px"
        value={draft.amount}
        onChange={(event) => updateDraft({ amount: event.target.value })}
        bg="bgSurface"
        border="1px solid"
        borderColor="borderBright"
        borderRadius="2px"
        fontFamily="mono"
        fontSize="16px"
      />

      <SlippageSelector value={draft.slippagePct} onChange={(slippagePct) => updateDraft({ slippagePct })} />

      <Button
        h="36px"
        variant="outline"
        borderColor="borderBright"
        color="textSecondary"
        fontFamily="mono"
        fontSize="10px"
        textTransform="uppercase"
        _hover={{ borderColor: 'amber', color: 'amber' }}
        onClick={() => void fetchQuote()}
      >
        {isQuoteLoading ? <BrailleSpinner label="CHECKING..." /> : 'CHECK GASLESS QUOTE'}
      </Button>

      <GaslessFeeBreakdown quote={quote} />
      {error ? <TerminalErrorLine message={error} /> : null}

      <MotionButton
        h="44px"
        bg={executionState === 'SUCCESS' ? 'green' : executionState === 'ERROR' ? 'red' : 'amber'}
        color="bgVoid"
        isDisabled={!quote || !eligible}
        fontFamily="mono"
        fontSize="11px"
        textTransform="uppercase"
        letterSpacing="0.1em"
        onClick={() => void execute()}
        variants={buttonStateVariants}
        animate={executionState}
        transition={springConfig.gentle}
      >
        {executionState === 'SIGNING' || executionState === 'SUBMITTING' ? (
          <BrailleSpinner label={executionStateLabel[executionState]} />
        ) : (
          'SIGN & SUBMIT'
        )}
      </MotionButton>
    </Flex>
  );
}

function EligibilityBadge({ eligible }: { eligible: boolean | null }) {
  if (eligible === null) {
    return (
      <Box
        h="18px"
        px={2}
        border="1px solid"
        borderColor="amber"
        color="amber"
        fontFamily="mono"
        fontSize="9px"
        textTransform="uppercase"
      >
        <BrailleSpinner label="CHECKING" color="amber" />
      </Box>
    );
  }

  return (
    <Box
      h="18px"
      px={2}
      display="flex"
      alignItems="center"
      border="1px solid"
      borderColor={eligible ? 'green' : 'red'}
      bg={eligible ? 'greenDim' : 'bgRaised'}
      color={eligible ? 'green' : 'red'}
      fontFamily="mono"
      fontSize="9px"
      textTransform="uppercase"
      borderRadius="1px"
    >
      {eligible ? 'ELIGIBLE' : 'INELIGIBLE'}
    </Box>
  );
}
