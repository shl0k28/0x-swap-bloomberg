import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Text,
} from '@chakra-ui/react';
import { ArrowUpDownIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import { formatUnits } from 'viem';
import { buttonStateVariants, springConfig } from '@/animations';
import { BrailleSpinner } from '@/components/common/BrailleSpinner';
import { SlippageSelector } from '@/components/common/SlippageSelector';
import { TokenSelector } from '@/components/common/TokenSelector';
import { TerminalErrorLine } from '@/components/common/TerminalErrorLine';
import { PriceImpactBanner } from '@/components/tabs/PriceImpactBanner';
import { useSwapTabController } from '@/hooks/useSwapTabController';
import { sanitizeDecimalInput } from '@/utils/number';

const MotionButton = motion(Button);

/**
 * Standard swap tab with approve + swap lifecycle.
 */
export function SwapTab() {
  const {
    chainId,
    draft,
    address,
    balances,
    quote,
    error,
    routeSummary,
    isQuoting,
    executionState,
    shouldBlockTrade,
    updateDraft,
    executeSwap,
    stateLabel,
  } = useSwapTabController();

  const usdHint =
    quote && quote.resolvedBuyToken.decimals > 0
      ? `$${Number(
          formatUnits(BigInt(quote.response.buyAmount), quote.resolvedBuyToken.decimals),
        ).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : '$--';

  return (
    <Flex direction="column" p={3} gap={3} h="100%" overflowY="auto">
      <HStack spacing={2} align="center">
        <TokenSelector
          chainId={chainId}
          value={draft.sellToken}
          onChange={(sellToken) => updateDraft({ sellToken })}
          walletAddress={address}
        />

        <Button
          h="24px"
          w="24px"
          minW="24px"
          bg="bgRaised"
          border="1px solid"
          borderColor="borderBright"
          color="textDim"
          onClick={() =>
            updateDraft({ sellToken: draft.buyToken, buyToken: draft.sellToken })
          }
          _hover={{ color: 'amber', borderColor: 'amber' }}
        >
          <ArrowUpDownIcon boxSize={3} />
        </Button>

        <TokenSelector
          chainId={chainId}
          value={draft.buyToken}
          onChange={(buyToken) => updateDraft({ buyToken })}
          walletAddress={address}
        />
      </HStack>

      <Box>
        <InputGroup size="lg">
          <Input
            h="44px"
            bg="bgSurface"
            border="1px solid"
            borderColor="borderBright"
            borderRadius="2px"
            fontFamily="mono"
            fontSize="16px"
            color="textPrimary"
            px={3}
            value={draft.amount}
            placeholder="0.0"
            onChange={(event) => updateDraft({ amount: sanitizeDecimalInput(event.target.value) })}
            _placeholder={{ color: 'textDim' }}
          />
          <InputRightElement h="44px" w="66px" pr={2}>
            <Button
              h="24px"
              px={2}
              bg="amberDim"
              color="amber"
              borderRadius="1px"
              fontFamily="mono"
              fontSize="9px"
              textTransform="uppercase"
              onClick={() => updateDraft({ amount: balances[draft.sellToken] ?? draft.amount })}
            >
              Max
            </Button>
          </InputRightElement>
        </InputGroup>
        <Text ml={1} mt={1} fontFamily="mono" fontSize="10px" color="textDim">
          {usdHint}
        </Text>
      </Box>

      <SlippageSelector value={draft.slippagePct} onChange={(slippagePct) => updateDraft({ slippagePct })} />

      <HStack spacing={2}>
        <Text fontSize="10px" color="textSecondary" fontFamily="mono">
          Deadline (minutes)
        </Text>
        <Input
          h="36px"
          w="80px"
          value={draft.deadlineMinutes}
          onChange={(event) => updateDraft({ deadlineMinutes: event.target.value })}
          bg="bgSurface"
          border="1px solid"
          borderColor="borderBright"
          borderRadius="2px"
          fontSize="12px"
          fontFamily="mono"
        />
      </HStack>

      <Box minH="18px">
        {isQuoting ? (
          <BrailleSpinner label="loading route..." color="cyan" />
        ) : (
          <Text color="cyan" fontFamily="mono" fontSize="10px">
            {routeSummary}
          </Text>
        )}
      </Box>

      <PriceImpactBanner impactPct={quote?.priceImpactPct ?? 0} />
      {error ? <TerminalErrorLine message={error} /> : null}

      <MotionButton
        h="44px"
        bg={executionState === 'SUCCESS' ? 'green' : executionState === 'ERROR' ? 'red' : 'amber'}
        color={executionState === 'SUCCESS' || executionState === 'ERROR' ? 'bgVoid' : 'bgVoid'}
        fontFamily="mono"
        fontSize="11px"
        textTransform="uppercase"
        letterSpacing="0.1em"
        borderRadius="2px"
        onClick={() => void executeSwap()}
        isDisabled={!quote || shouldBlockTrade}
        variants={buttonStateVariants}
        animate={executionState}
        transition={springConfig.gentle}
        _hover={{ bg: executionState === 'IDLE' ? 'amberDim' : undefined }}
      >
        {executionState === 'APPROVING' || executionState === 'SWAPPING' ? (
          <BrailleSpinner label={stateLabel[executionState]} />
        ) : (
          stateLabel[executionState]
        )}
      </MotionButton>
    </Flex>
  );
}
