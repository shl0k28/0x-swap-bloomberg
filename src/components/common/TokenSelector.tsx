import {
  Box,
  Button,
  Flex,
  Input,
  List,
  ListItem,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import type { Address } from 'viem';
import { getTokensForChain } from '@/constants/tokens';
import { TokenAvatar } from '@/components/common/TokenAvatar';
import { useTokenBalanceMap } from '@/hooks/useTokenBalanceMap';

/**
 * Searchable token selector with logo and balance rows.
 */
export function TokenSelector({
  chainId,
  value,
  onChange,
  walletAddress,
}: {
  chainId: number;
  value: string;
  onChange: (symbol: string) => void;
  walletAddress?: Address;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [search, setSearch] = useState('');
  const tokens = getTokensForChain(chainId);
  const balances = useTokenBalanceMap(chainId, walletAddress);

  const selected = tokens.find((token) => token.symbol === value) ?? tokens[0];
  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (query.length === 0) {
      return tokens;
    }

    return tokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(query) || token.name.toLowerCase().includes(query),
    );
  }, [search, tokens]);

  return (
    <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose} placement="bottom-start">
      <PopoverTrigger>
        <Button
          h="36px"
          minW={{ base: '140px', md: '180px' }}
          px={3}
          bg="bgSurface"
          border="1px solid"
          borderColor="borderBright"
          borderRadius="2px"
          color="textPrimary"
          fontFamily="mono"
          fontSize="12px"
          justifyContent="flex-start"
          _hover={{ bg: 'bgRaised', borderColor: 'amber' }}
          _active={{ bg: 'bgRaised' }}
        >
          <TokenAvatar symbol={selected?.symbol ?? '??'} logoUri={selected?.logoUri} size="sm" />
          <Text ml={2} color="textPrimary">
            {selected?.symbol ?? value}
          </Text>
          <Text ml="auto" fontSize="10px" color="textSecondary">
            {balances[selected?.symbol ?? ''] ?? '--'}
          </Text>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        bg="bgBase"
        border="1px solid"
        borderColor="borderBright"
        borderRadius="2px"
        w="280px"
      >
        <PopoverBody p={2}>
          <Input
            h="30px"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search token"
            bg="bgSurface"
            border="1px solid"
            borderColor="border"
            borderRadius="2px"
            fontFamily="mono"
            fontSize="10px"
            color="textPrimary"
            _placeholder={{ color: 'textDim' }}
            _focusVisible={{ borderColor: 'amber', boxShadow: 'none' }}
            mb={2}
          />

          <List maxH="280px" overflowY="auto">
            {filtered.map((token) => (
              <ListItem
                key={token.symbol}
                px={2}
                py={1}
                borderRadius="2px"
                _hover={{ bg: 'bgRaised' }}
                cursor="pointer"
                onClick={() => {
                  onChange(token.symbol);
                  onClose();
                  setSearch('');
                }}
              >
                <Flex align="center" gap={2}>
                  <TokenAvatar symbol={token.symbol} logoUri={token.logoUri} size="xs" />
                  <Box>
                    <Text fontSize="12px" fontFamily="mono" color="textPrimary">
                      {token.symbol}
                    </Text>
                    <Text fontSize="10px" color="textDim" fontFamily="body">
                      {token.name}
                    </Text>
                  </Box>
                  <Text ml="auto" fontSize="10px" color="textSecondary" fontFamily="mono">
                    {balances[token.symbol] ?? '--'}
                  </Text>
                </Flex>
              </ListItem>
            ))}
          </List>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
