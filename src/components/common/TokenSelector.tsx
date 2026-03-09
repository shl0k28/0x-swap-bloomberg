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
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { FixedSizeList, type ListChildComponentProps } from 'react-window';
import { formatUnits, isAddress, type Address } from 'viem';
import { TokenLogo } from '@/components/TokenLogo';
import type { TokenBalance } from '@/hooks/useWalletTokenBalances';
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
  filterByWalletBalance?: boolean;
  tokenBalances?: Record<string, TokenBalance>;
  balancesLoading?: boolean;
  balancesError?: string | null;
}

interface VirtualRowData {
  tokens: TokenInfo[];
  chainId: number;
  selectedValue: string;
  balanceDisplayMap: Record<string, string>;
  onSelect: (token: TokenInfo) => void;
}

/**
 * Searchable token selector with optional wallet-balance gating for sell side.
 */
export function TokenSelector({
  chainId,
  value,
  onChange,
  walletAddress,
  triggerButtonProps,
  rightElement,
  filterByWalletBalance = false,
  tokenBalances,
  balancesLoading = false,
  balancesError = null,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const { tokens, isLoading } = useTokenList(chainId);

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

  useEffect(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, [chainId]);

  const selected = useMemo(() => findSelectedToken(tokens, value), [tokens, value]);
  const normalizedBalances = useMemo(() => tokenBalances ?? {}, [tokenBalances]);
  const hasWalletAddress = Boolean(walletAddress);
  const shouldFilterByBalance = filterByWalletBalance && hasWalletAddress;

  const balanceDisplayMap = useMemo(() => {
    const next: Record<string, string> = {};
    for (const token of tokens) {
      next[getTokenBalanceKey(token)] = formatTokenBalance(token, normalizedBalances);
    }
    return next;
  }, [normalizedBalances, tokens]);

  const tokensWithBalance = useMemo(
    () => tokens.filter((token) => hasTokenBalance(token, normalizedBalances)),
    [normalizedBalances, tokens],
  );

  const showAllTokensFallback =
    shouldFilterByBalance && !balancesLoading && !balancesError && tokensWithBalance.length === 0;

  const sourceTokens = useMemo(() => {
    if (!shouldFilterByBalance) {
      return tokens;
    }

    if (balancesLoading || showAllTokensFallback || balancesError) {
      return tokens;
    }

    return tokensWithBalance;
  }, [balancesError, balancesLoading, shouldFilterByBalance, showAllTokensFallback, tokens, tokensWithBalance]);

  const filtered = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (normalized.length === 0) {
      return sourceTokens;
    }

    return sourceTokens
      .filter((token) => {
        const symbol = token.symbol.toLowerCase();
        const name = token.name.toLowerCase();
        const address = token.address.toLowerCase();
        return symbol.includes(normalized) || name.includes(normalized) || address.startsWith(normalized);
      })
      .slice(0, 50);
  }, [searchQuery, sourceTokens]);

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
    balanceDisplayMap,
    onSelect: handleSelect,
  };

  const selectedLabel = selected?.symbol ?? value;
  const selectedAddress = selected?.address ?? value;
  const selectedBalance = selected ? balanceDisplayMap[getTokenBalanceKey(selected)] ?? '--' : '--';

  const balanceStatusLabel = getBalanceStatusLabel({
    enabled: shouldFilterByBalance,
    loading: balancesLoading,
    hasFallback: showAllTokensFallback,
    hasError: Boolean(balancesError),
  });

  return (
    <Box position="relative" ref={containerRef}>
      <Button
        h="36px"
        minW={{ base: '136px', md: '160px' }}
        px={3}
        bg="bgSurface"
        border="1px solid"
        borderColor={isOpen ? 'amberDim' : 'borderBright'}
        borderRadius="2px"
        color="textPrimary"
        fontFamily="mono"
        fontSize="12px"
        justifyContent="flex-start"
        onClick={() => setIsOpen((open) => !open)}
        _hover={{ bg: 'bgRaised', borderColor: 'borderBright' }}
        _active={{ bg: 'bgRaised', borderColor: isOpen ? 'amberDim' : 'borderBright' }}
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
            _focus={{ borderColor: 'amberDim', boxShadow: 'none' }}
            mb={2}
          />

          {balanceStatusLabel ? (
            <Text px={1} pb={2} fontFamily="mono" fontSize="9px" color="textDim" letterSpacing="0.08em">
              {balanceStatusLabel}
            </Text>
          ) : null}

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
                    balance={balanceDisplayMap[getTokenBalanceKey(token)] ?? '--'}
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
        balance={data.balanceDisplayMap[getTokenBalanceKey(token)] ?? '--'}
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
      borderColor={isSelected ? 'amberDim' : 'transparent'}
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

function getTokenBalanceKey(token: TokenInfo): string {
  return token.isNative ? 'native' : token.address.toLowerCase();
}

function hasTokenBalance(token: TokenInfo, balances: Record<string, TokenBalance>): boolean {
  const entry = balances[getTokenBalanceKey(token)];
  return entry?.hasBalance === true;
}

function formatTokenBalance(token: TokenInfo, balances: Record<string, TokenBalance>): string {
  const entry = balances[getTokenBalanceKey(token)];
  if (!entry || !entry.hasBalance) {
    return '--';
  }

  try {
    const parsed = BigInt(entry.rawBalance);
    const human = Number(formatUnits(parsed, token.decimals));
    if (!Number.isFinite(human) || human <= 0) {
      return '--';
    }

    if (human > 1_000) {
      return human.toFixed(2);
    }

    if (human > 1) {
      return human.toFixed(4).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    }

    return human.toPrecision(4);
  } catch {
    return '--';
  }
}

function getBalanceStatusLabel({
  enabled,
  loading,
  hasFallback,
  hasError,
}: {
  enabled: boolean;
  loading: boolean;
  hasFallback: boolean;
  hasError: boolean;
}): string | null {
  if (!enabled) {
    return null;
  }

  if (loading) {
    return 'LOADING BALANCES...';
  }

  if (hasError) {
    return 'BALANCE LOOKUP UNAVAILABLE — SHOWING ALL TOKENS';
  }

  if (hasFallback) {
    return 'NO BALANCES FOUND — SHOWING ALL TOKENS';
  }

  return null;
}
