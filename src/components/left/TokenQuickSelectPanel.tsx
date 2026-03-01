import { Button, Flex, HStack, Text } from '@chakra-ui/react';
import { TokenLogo } from '@/components/TokenLogo';
import { LeftPanelSection } from '@/components/left/LeftPanelSection';
import { PINNED_SYMBOLS, getTokensForChain } from '@/constants/tokens';
import { useAppStore } from '@/stores/appStore';

/**
 * Quick token shortcuts that pre-fill the active tab's sell token.
 */
export function TokenQuickSelectPanel() {
  const chainId = useAppStore((state) => state.selectedChainId);
  const applyQuickToken = useAppStore((state) => state.applyQuickToken);
  const tokens = getTokensForChain(chainId);

  return (
    <LeftPanelSection title="TOKEN QUICK-SELECT">
      <Flex wrap="wrap" gap={1.5}>
        {PINNED_SYMBOLS.map((symbol) => {
          const token = tokens.find((entry) => entry.symbol === symbol);
          const logoAddress = token?.address ?? symbol;
          return (
            <Button
              key={symbol}
              h="22px"
              px={2}
              bg="bgSurface"
              border="1px solid"
              borderColor="borderBright"
              color="textSecondary"
              borderRadius="2px"
              fontFamily="mono"
              fontSize="10px"
              _hover={{ borderColor: 'amber', color: 'amber' }}
              _active={{ bg: 'amberDim', color: 'amber', borderColor: 'amber' }}
              onClick={() => applyQuickToken(symbol)}
            >
              <HStack spacing={1}>
                <TokenLogo address={logoAddress} chainId={chainId} symbol={symbol} size={16} />
                <Text>{symbol}</Text>
              </HStack>
            </Button>
          );
        })}
      </Flex>
    </LeftPanelSection>
  );
}
