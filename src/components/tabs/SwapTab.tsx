import {
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Skeleton,
  Text,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { formatUnits, isAddress } from 'viem';
import { buttonStateVariants, springConfig } from '@/animations';
import { BrailleSpinner } from '@/components/common/BrailleSpinner';
import { SlippageSelector } from '@/components/common/SlippageSelector';
import { TokenSelector } from '@/components/common/TokenSelector';
import { TerminalErrorLine } from '@/components/common/TerminalErrorLine';
import { PriceImpactBanner } from '@/components/tabs/PriceImpactBanner';
import { getNativeToken } from '@/constants/nativeTokens';
import { resolveToken, type ResolvedToken } from '@/constants/tokens';
import { useSwapTabController } from '@/hooks/useSwapTabController';
import type { SwapQuoteEnvelope } from '@/services/zerox/types';
import { usePriceStore } from '@/store/priceStore';
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
    isConnected,
    balances,
    quote,
    error,
    routeSummary,
    walletTokenBalances,
    walletBalancesLoading,
    walletBalancesError,
    isQuoting,
    executionState,
    shouldBlockTrade,
    updateDraft,
    executeSwap,
    stateLabel,
  } = useSwapTabController();
  const [transposeCount, setTransposeCount] = useState(0);

  const prices = usePriceStore((state) => state.prices);
  const nativeToken = getNativeToken(chainId);
  const nativePrice = prices[nativeToken.symbol as keyof typeof prices]?.price ?? 0;
  const ethPrice = prices.ETH?.price ?? 0;

  const resolvedSellToken = useMemo(() => resolveSellToken(chainId, draft.sellToken, quote), [
    chainId,
    draft.sellToken,
    quote,
  ]);

  const usdValue = getUsdValue({
    amount: draft.amount,
    token: resolvedSellToken,
    chainId,
    nativePrice,
    ethPrice,
    quote,
  });

  const usdHint = usdValue > 0 ? toCurrency(usdValue) : '$--';
  const buyAmountLabel = getBuyAmountLabel(quote, isQuoting, error);
  const buyAmountColor = getBuyAmountColor(quote, isQuoting, error);

  const buyUsdValue = getBuyUsdValue(quote, ethPrice);
  const buyUsdHint = buyUsdValue > 0 ? toCurrency(buyUsdValue) : '$--';

  const pricingLine = getPricingLine(quote, draft.amount);
  const priceImpactColor = getPriceImpactColor(pricingLine.priceImpactPct);

  const handleTranspose = () => {
    const nextAmount = quote
      ? formatForInput(quote.response.buyAmount, quote.resolvedBuyToken.decimals)
      : draft.amount;

    updateDraft({
      sellToken: draft.buyToken,
      buyToken: draft.sellToken,
      amount: nextAmount,
    });
    setTransposeCount((count) => count + 1);
  };

  return (
    <Flex direction="column" p={3} h="100%" overflowY="auto" alignItems="flex-start">
      <Box w="100%" maxW="480px">
        <Grid templateColumns="1fr 32px 1fr" gap="8px" w="100%" alignItems="center">
          <TokenSelector
            chainId={chainId}
            value={draft.sellToken}
            onChange={(sellToken) => updateDraft({ sellToken })}
            walletAddress={address}
            filterByWalletBalance
            tokenBalances={walletTokenBalances}
            balancesLoading={walletBalancesLoading}
            balancesError={walletBalancesError}
            triggerButtonProps={{
              h: '36px',
              w: 'full',
              maxW: 'unset',
              minW: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          />

          <MotionButton
            onClick={handleTranspose}
            variant="unstyled"
            w="32px"
            h="32px"
            minW="32px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            alignSelf="center"
            p={0}
            bg="bgRaised"
            border="1px solid"
            borderColor="borderBright"
            borderRadius="2px"
            fontSize="13px"
            fontFamily="mono"
            color="textDim"
            _hover={{ color: 'amber', borderColor: 'amberDim' }}
            _active={{ bg: 'bgRaised' }}
            _focus={{ boxShadow: 'none' }}
            aria-label="Swap tokens"
            animate={{ rotate: transposeCount * 180 }}
            transition={springConfig.gentle}
          >
            {'<>'}
          </MotionButton>

          <TokenSelector
            chainId={chainId}
            value={draft.buyToken}
            onChange={(buyToken) => updateDraft({ buyToken })}
            walletAddress={address}
            tokenBalances={walletTokenBalances}
            balancesLoading={walletBalancesLoading}
            balancesError={walletBalancesError}
            triggerButtonProps={{
              h: '36px',
              w: 'full',
              maxW: 'unset',
              minW: 0,
              display: 'flex',
              alignItems: 'center',
            }}
            rightElement={
              isQuoting ? (
                <Flex ml="auto" w="80px" justify="flex-end">
                  <Skeleton w="80px" h="16px" startColor="bgSurface" endColor="bgRaised" />
                </Flex>
              ) : (
                <Text
                  ml="auto"
                  fontSize="10px"
                  color={buyAmountColor}
                  textAlign="right"
                  noOfLines={1}
                  alignSelf="center"
                >
                  {buyAmountLabel}
                </Text>
              )
            }
          />
        </Grid>

        <Grid templateColumns="1fr 32px 1fr" gap="8px" w="100%" mt="4px" alignItems="center">
          <Text fontSize="10px" fontFamily="mono" color="textDim" textAlign="left">
            {buyUsdHint}
          </Text>
          <Box />
          <Text fontSize="10px" fontFamily="mono" color="textDim" textAlign="right" noOfLines={1}>
            {pricingLine.text ? (
              <>
                {pricingLine.text}{' '}
                <Text as="span" color={priceImpactColor}>
                  ({pricingLine.priceImpactPct.toFixed(2)}%)
                </Text>
              </>
            ) : (
              '$--'
            )}
          </Text>
        </Grid>

        <Box mt="12px">
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
        </Box>

        <Text mt="4px" fontFamily="mono" fontSize="10px" color="textDim">
          {usdHint}
        </Text>

        <Box mt="12px">
          <SlippageSelector value={draft.slippagePct} onChange={(slippagePct) => updateDraft({ slippagePct })} />
        </Box>

        <HStack spacing={2} mt="8px" w="100%" alignItems="center">
          <Text fontSize="10px" color="textSecondary" fontFamily="mono" w="120px" flexShrink={0}>
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

        <Box mt="12px" minH="18px">
          {isQuoting ? (
            <BrailleSpinner label="loading route..." color="cyan" />
          ) : (
            <Text color="cyan" fontFamily="mono" fontSize="10px">
              {routeSummary}
            </Text>
          )}
        </Box>

        <Box mt="8px">
          <PriceImpactBanner impactPct={quote?.priceImpactPct ?? 0} />
        </Box>

        {error ? (
          <Box mt="8px">
            <TerminalErrorLine message={error} />
          </Box>
        ) : null}

        <MotionButton
          mt="12px"
          h="44px"
          w="100%"
          maxW="480px"
          bg={executionState === 'SUCCESS' ? 'green' : executionState === 'ERROR' ? 'red' : 'amber'}
          color="bgVoid"
          fontFamily="mono"
          fontSize="11px"
          textTransform="uppercase"
          letterSpacing="0.1em"
          borderRadius="2px"
          onClick={() => void executeSwap()}
          isDisabled={!quote || isQuoting || !isConnected || shouldBlockTrade}
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
      </Box>
    </Flex>
  );
}

function resolveSellToken(
  chainId: number,
  sellToken: string,
  quote: SwapQuoteEnvelope | null,
): ResolvedToken | null {
  if (quote && quote.request.sellToken === sellToken) {
    return quote.resolvedSellToken;
  }

  try {
    return resolveToken(chainId, sellToken);
  } catch {
    return null;
  }
}

function getUsdValue({
  amount,
  token,
  chainId,
  nativePrice,
  ethPrice,
  quote,
}: {
  amount: string;
  token: ResolvedToken | null;
  chainId: number;
  nativePrice: number;
  ethPrice: number;
  quote: SwapQuoteEnvelope | null;
}): number {
  const parsedAmount = Number.parseFloat(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || !token) {
    return 0;
  }

  const nativeAddress = getNativeToken(chainId).logoAddress.toLowerCase();
  const isNativeToken =
    token.isNative ||
    (isAddress(token.addressOrSymbol) && token.addressOrSymbol.toLowerCase() === nativeAddress);

  if (isNativeToken && nativePrice > 0) {
    return parsedAmount * nativePrice;
  }

  if (!quote || ethPrice <= 0) {
    return 0;
  }

  const sellAmountBeforeFeeInEth = getQuoteNumberField(quote.response, 'sellAmountBeforeFeeInEth');
  if (sellAmountBeforeFeeInEth <= 0) {
    return 0;
  }

  return sellAmountBeforeFeeInEth * ethPrice;
}

function getBuyAmountLabel(
  quote: SwapQuoteEnvelope | null,
  isQuoting: boolean,
  error: string | null,
): string {
  if (isQuoting) {
    return '--';
  }

  if (error && !quote) {
    return '[QUOTE ERROR]';
  }

  if (!quote) {
    return '--';
  }

  if (!quote.response.liquidityAvailable) {
    return 'NO LIQUIDITY';
  }

  return formatReceivedAmount(quote.response.buyAmount, quote.resolvedBuyToken.decimals);
}

function getBuyAmountColor(
  quote: SwapQuoteEnvelope | null,
  isQuoting: boolean,
  error: string | null,
): string {
  if (isQuoting || !quote) {
    return 'textDim';
  }

  if (error && !quote) {
    return 'red';
  }

  if (!quote.response.liquidityAvailable) {
    return 'textDim';
  }

  return 'textPrimary';
}

function getPricingLine(
  quote: SwapQuoteEnvelope | null,
  sellAmountInput: string,
): { text: string | null; priceImpactPct: number } {
  if (!quote || !quote.response.liquidityAvailable) {
    return { text: null, priceImpactPct: 0 };
  }

  const sellAmount = Number.parseFloat(sellAmountInput);
  if (!Number.isFinite(sellAmount) || sellAmount <= 0) {
    return { text: null, priceImpactPct: 0 };
  }

  const buyAmount = Number(formatUnits(BigInt(quote.response.buyAmount), quote.resolvedBuyToken.decimals));
  if (!Number.isFinite(buyAmount) || buyAmount <= 0) {
    return { text: null, priceImpactPct: 0 };
  }

  const rate = buyAmount / sellAmount;
  const priceImpactPct = getEstimatedPriceImpact(quote);
  const text = `1 ${quote.resolvedSellToken.symbol} = ${formatRate(rate)} ${quote.resolvedBuyToken.symbol}`;
  return { text, priceImpactPct };
}

function getBuyUsdValue(quote: SwapQuoteEnvelope | null, ethPrice: number): number {
  if (!quote || ethPrice <= 0) {
    return 0;
  }

  const buyAmountInEth = getQuoteNumberField(quote.response, 'buyAmountInEth');
  if (buyAmountInEth <= 0) {
    return 0;
  }

  return buyAmountInEth * ethPrice;
}

function getEstimatedPriceImpact(quote: SwapQuoteEnvelope): number {
  const estimated = getQuoteNumberField(quote.response, 'estimatedPriceImpact');
  if (estimated > 0) {
    return estimated;
  }

  return quote.priceImpactPct;
}

function getPriceImpactColor(priceImpactPct: number): string {
  if (priceImpactPct < 0.5) {
    return 'green';
  }

  if (priceImpactPct <= 2) {
    return 'amber';
  }

  return 'red';
}

function getQuoteNumberField(response: SwapQuoteEnvelope['response'], key: string): number {
  const candidate = (response as unknown as Record<string, unknown>)[key];
  if (typeof candidate === 'number' && Number.isFinite(candidate)) {
    return candidate;
  }

  if (typeof candidate === 'string') {
    const parsed = Number(candidate);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function formatReceivedAmount(rawAmount: string, decimals: number): string {
  const value = Number(formatUnits(BigInt(rawAmount), decimals));
  if (!Number.isFinite(value)) {
    return '--';
  }

  if (value > 1000) {
    return value.toFixed(2);
  }

  if (value > 1) {
    return value.toFixed(4);
  }

  return value.toPrecision(4);
}

function formatRate(rate: number): string {
  if (!Number.isFinite(rate)) {
    return '--';
  }

  if (rate > 1000) {
    return rate.toFixed(2);
  }

  if (rate > 1) {
    return rate.toFixed(4);
  }

  return rate.toPrecision(4);
}

function formatForInput(rawAmount: string, decimals: number): string {
  const value = Number(formatUnits(BigInt(rawAmount), decimals));
  if (!Number.isFinite(value) || value <= 0) {
    return '0';
  }

  return value > 1 ? value.toFixed(6).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1') : value.toPrecision(6);
}

function toCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}
