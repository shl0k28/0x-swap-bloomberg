import {
  Box,
  Button,
  Flex,
  Input,
  Skeleton,
  Text,
  VStack,
  useOutsideClick,
  type ButtonProps,
} from '@chakra-ui/react';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { FixedSizeList, type ListChildComponentProps } from 'react-window';
import { isAddress, type Address } from 'viem';
import { TokenLogo } from '@/components/TokenLogo';
import { useTokenBalanceMap } from '@/hooks/useTokenBalanceMap';
import { useTokenList } from '@/hooks/useTokenList';
import type { TokenInfo } from '@/services/tokenListService';

const ROW_HEIGHT = 44;
const MAX_LIST_HEIGHT = 240;

interface TokenSelectorProps {
  chainId: number;
  value: string;
  onChange: (symbolOrAddress: string) => void;
  walletAddress?: Address;
  triggerButtonProps?: ButtonProps;
  rightElement?: ReactNode;
}

interface VirtualRowData {
  tokens: TokenInfo[];
  chainId: number;
  selectedValue: string;
  balances: Record<string, string>;
  onSelect: (token: TokenInfo) => void;
}

/**
 * Searchable token selector with virtualized large-list rendering.
 */
export function TokenSelector({
  chainId,
  value,
  onChange,
  walletAddress,
  triggerButtonProps,
  rightElement,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const balances = useTokenBalanceMap(chainId, walletAddress);
  const { tokens, isLoading, search } = useTokenList(chainId);

  useOutsideClick({
    ref: containerRef,
    handler: () => {
      setIsOpen(false);
      setSearchQuery('');
    },
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      setIsOpen(false);
      setSearchQuery('');
    };

    window.addEventListener('keydown', handleEscape);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const selected = useMemo(() => findSelectedToken(tokens, value), [tokens, value]);

  const filtered = useMemo(() => {
    const matches = search(searchQuery);
    if (searchQuery.trim().length > 0) {
      return matches.slice(0, 50);
    }

    return matches;
  }, [search, searchQuery]);

  const virtualized = filtered.length > 200;
  const listHeight = Math.min(MAX_LIST_HEIGHT, Math.max(filtered.length * ROW_HEIGHT, ROW_HEIGHT));

  const handleSelect = (token: TokenInfo) => {
    onChange(token.isNative ? token.symbol : token.address);
    setIsOpen(false);
    setSearchQuery('');
  };

  const rowData: VirtualRowData = {
    tokens: filtered,
    chainId,
    selectedValue: value,
    balances,
    onSelect: handleSelect,
  };

  const selectedLabel = selected?.symbol ?? value;
  const selectedAddress = selected?.address ?? value;
  const selectedBalance = selected ? balances[selected.symbol] ?? '--' : '--';

  return (
    <Box position="relative" ref={containerRef}>
      <Button
        h="36px"
        minW={{ base: '136px', md: '160px' }}
        px={3}
        bg="bgSurface"
        border="1px solid"
        borderColor="borderBright"
        borderRadius="2px"
        color="textPrimary"
        fontFamily="mono"
        fontSize="12px"
        justifyContent="flex-start"
        onClick={() => setIsOpen((open) => !open)}
        _hover={{ bg: 'bgRaised', borderColor: 'amber' }}
        _active={{ bg: 'bgRaised' }}
        {...triggerButtonProps}
      >
        <TokenLogo address={selectedAddress} chainId={chainId} symbol={selectedLabel} />
        <Text ml={2} color="textPrimary" noOfLines={1}>
          {selectedLabel}
        </Text>
        {rightElement ?? (
          <Text ml="auto" fontSize="10px" color="textSecondary" textAlign="right" noOfLines={1}>
            {selectedBalance}
          </Text>
        )}
      </Button>

      {isOpen ? (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left={0}
          zIndex={100}
          w="320px"
          bg="bgBase"
          border="1px solid"
          borderColor="borderBright"
          borderRadius="2px"
          p={2}
        >
          <Input
            ref={searchInputRef}
            h="36px"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search token"
            bg="bgSurface"
            border="1px solid"
            borderColor="borderBright"
            borderRadius="2px"
            fontFamily="mono"
            fontSize="12px"
            color="textPrimary"
            _placeholder={{ color: 'textDim' }}
            _focus={{ borderColor: 'amber', boxShadow: 'none' }}
            mb={2}
          />

          <Box maxH={`${MAX_LIST_HEIGHT}px`} overflowY="auto">
            {isLoading ? (
              <VStack spacing={2} align="stretch">
                {[0, 1, 2].map((row) => (
                  <Skeleton key={row} h="44px" startColor="bgSurface" endColor="bgRaised" borderRadius="2px" />
                ))}
              </VStack>
            ) : filtered.length === 0 ? (
              <Text py={3} textAlign="center" color="textDim" fontFamily="mono" fontSize="10px">
                No tokens found
              </Text>
            ) : virtualized ? (
              <FixedSizeList
                height={listHeight}
                width="100%"
                itemCount={filtered.length}
                itemSize={ROW_HEIGHT}
                itemData={rowData}
              >
                {VirtualizedTokenRow}
              </FixedSizeList>
            ) : (
              <VStack spacing={0} align="stretch">
                {filtered.map((token) => (
                  <TokenRow
                    key={`${token.chainId}:${token.address}`}
                    token={token}
                    chainId={chainId}
                    balance={balances[token.symbol] ?? '--'}
                    isSelected={isTokenSelected(token, value)}
                    onClick={() => handleSelect(token)}
                  />
                ))}
              </VStack>
            )}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

function VirtualizedTokenRow({
  index,
  style,
  data,
}: ListChildComponentProps<VirtualRowData>) {
  const token = data.tokens[index];
  if (!token) {
    return null;
  }

  const styleWithPadding = {
    ...style,
    top: Number(style.top ?? 0) + 1,
    left: Number(style.left ?? 0),
    right: Number(style.right ?? 0),
  } satisfies CSSProperties;

  return (
    <Box style={styleWithPadding} px={0}>
      <TokenRow
        token={token}
        chainId={data.chainId}
        balance={data.balances[token.symbol] ?? '--'}
        isSelected={isTokenSelected(token, data.selectedValue)}
        onClick={() => data.onSelect(token)}
      />
    </Box>
  );
}

function TokenRow({
  token,
  chainId,
  balance,
  isSelected,
  onClick,
}: {
  token: TokenInfo;
  chainId: number;
  balance: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <Flex
      h="44px"
      align="center"
      px={3}
      border="1px solid"
      borderColor={isSelected ? 'amber' : 'transparent'}
      borderRadius="2px"
      cursor="pointer"
      _hover={{ bg: 'bgRaised' }}
      onClick={onClick}
    >
      <TokenLogo address={token.address} chainId={chainId} symbol={token.symbol} size={24} />
      <VStack ml={2} spacing={0} align="flex-start" minW={0}>
        <Flex align="center" gap={1}>
          <Text fontSize="12px" fontFamily="mono" color="amber" noOfLines={1}>
            {token.symbol}
          </Text>
          {token.isNative ? (
            <Text
              fontFamily="mono"
              fontSize="8px"
              color="amber"
              bg="amberDim"
              px={1}
              borderRadius="1px"
            >
              NATIVE
            </Text>
          ) : null}
        </Flex>
        <Text fontSize="10px" color="textDim" fontFamily="mono" noOfLines={1} maxW="180px">
          {token.name}
        </Text>
      </VStack>
      <Text ml="auto" fontSize="10px" color="textSecondary" fontFamily="mono" textAlign="right">
        {balance}
      </Text>
    </Flex>
  );
}

function findSelectedToken(tokens: TokenInfo[], value: string): TokenInfo | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return tokens[0];
  }

  if (isAddress(trimmed)) {
    return tokens.find((token) => token.address.toLowerCase() === trimmed.toLowerCase());
  }

  const upper = trimmed.toUpperCase();
  return tokens.find((token) => token.symbol.toUpperCase() === upper);
}

function isTokenSelected(token: TokenInfo, value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }

  if (isAddress(trimmed)) {
    return token.address.toLowerCase() === trimmed.toLowerCase();
  }

  return token.symbol.toUpperCase() === trimmed.toUpperCase();
}
