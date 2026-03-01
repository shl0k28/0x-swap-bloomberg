import { Button, Circle, HStack, Menu, MenuButton, MenuItem, MenuList, Text } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useSwitchChain } from 'wagmi';
import { CHAIN_METADATA, SUPPORTED_CHAIN_IDS, type SupportedChainId } from '@/constants/chains';
import { useAppStore } from '@/stores/appStore';

/**
 * Chain switcher controlling quote and wallet network context.
 */
export function ChainSelector() {
  const chainId = useAppStore((state) => state.selectedChainId);
  const setChainId = useAppStore((state) => state.setSelectedChainId);
  const { switchChainAsync } = useSwitchChain();

  const current = CHAIN_METADATA[chainId as SupportedChainId] ?? CHAIN_METADATA[8453];

  return (
    <Menu>
      <MenuButton
        as={Button}
        h="28px"
        px={3}
        bg="bgSurface"
        border="1px solid"
        borderColor="borderBright"
        color="textSecondary"
        rightIcon={<ChevronDownIcon />}
        fontFamily="mono"
        fontSize="10px"
        _hover={{ bg: 'bgRaised' }}
        _active={{ bg: 'bgRaised' }}
      >
        <HStack spacing={2}>
          <Circle size="6px" bg={isProductionChain(current.id) ? 'green' : 'amber'} />
          <Text color="amber">{current.shortName}</Text>
        </HStack>
      </MenuButton>

      <MenuList bg="bgBase" borderColor="borderBright" borderRadius="2px" minW="150px" p={1}>
        {SUPPORTED_CHAIN_IDS.map((id) => {
          const option = CHAIN_METADATA[id];
          return (
            <MenuItem
              key={id}
              bg="transparent"
              fontFamily="mono"
              fontSize="10px"
              color="textSecondary"
              borderRadius="2px"
              _hover={{ bg: 'bgSurface', color: 'textPrimary' }}
              onClick={() => {
                setChainId(id);
                void switchChainAsync({ chainId: id }).catch(() => undefined);
              }}
            >
              <HStack spacing={2}>
                <Circle size="6px" bg={isProductionChain(id) ? 'green' : 'amber'} />
                <Text color={id === current.id ? 'amber' : 'textSecondary'}>{option.shortName}</Text>
              </HStack>
            </MenuItem>
          );
        })}
      </MenuList>
    </Menu>
  );
}

/**
 * Marks mainnet/base as production-like chain contexts.
 */
function isProductionChain(chainId: SupportedChainId): boolean {
  return chainId === 1 || chainId === 8453;
}
