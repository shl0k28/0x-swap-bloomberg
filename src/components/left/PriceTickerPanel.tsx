import { Flex, Text, useToken } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { LeftPanelSection } from '@/components/left/LeftPanelSection';
import { type PythSymbol } from '@/constants/pythFeeds';
import { usePriceStore } from '@/store/priceStore';

const MotionText = motion(Text);
const symbols: PythSymbol[] = ['ETH', 'BTC', 'SOL', 'USDT'];

/**
 * Live market ticker using Pyth websocket price feed.
 */
export function PriceTickerPanel() {
  const prices = usePriceStore((state) => state.prices);
  const connectionStatus = usePriceStore((state) => state.connectionStatus);
  const [amberColor, textPrimaryColor, textDimColor] = useToken('colors', [
    'amber',
    'textPrimary',
    'textDim',
  ]);

  const rows = useMemo(
    () =>
      symbols.map((symbol) => ({
        symbol,
        entry: prices[symbol],
      })),
    [prices],
  );

  return (
    <LeftPanelSection title="PRICE TICKER">
      <Flex direction="column">
        {rows.map((row, index) => {
          const isLast = index === rows.length - 1;
          return (
            <TickerRow
              key={row.symbol}
              symbol={row.symbol}
              connectionStatus={connectionStatus}
              price={row.entry?.price}
              delta={row.entry?.delta}
              flash={row.entry?.flash ?? false}
              hasDivider={!isLast}
              amberColor={amberColor}
              textPrimaryColor={textPrimaryColor}
              textDimColor={textDimColor}
            />
          );
        })}
      </Flex>
    </LeftPanelSection>
  );
}

function TickerRow({
  symbol,
  connectionStatus,
  price,
  delta,
  flash,
  hasDivider,
  amberColor,
  textPrimaryColor,
  textDimColor,
}: {
  symbol: PythSymbol;
  connectionStatus: 'idle' | 'connecting' | 'online' | 'error';
  price?: number;
  delta?: number;
  flash: boolean;
  hasDivider: boolean;
  amberColor: string;
  textPrimaryColor: string;
  textDimColor: string;
}) {
  const hasPrice = typeof price === 'number' && Number.isFinite(price);
  const hasDelta = typeof delta === 'number' && Number.isFinite(delta);
  const isFeedError = connectionStatus === 'error' && !hasPrice;
  const isLoading = (connectionStatus === 'connecting' || connectionStatus === 'idle') && !hasPrice;
  const deltaColor = hasDelta ? (delta > 0 ? 'green' : delta < 0 ? 'red' : 'textDim') : 'textDim';

  return (
    <Flex
      h="26px"
      align="center"
      borderBottom={hasDivider ? '1px solid' : 'none'}
      borderColor="border"
      fontFamily="mono"
      fontSize="10px"
      gap={1}
    >
      <Text w="36px" color="amber">
        {symbol}
      </Text>

      <MotionText
        flex="1"
        textAlign="right"
        color={hasPrice ? 'textPrimary' : 'textDim'}
        animate={{ color: flash ? amberColor : hasPrice ? textPrimaryColor : textDimColor }}
        transition={{ duration: 0.6 }}
      >
        {isFeedError
          ? 'FEED ERR'
          : hasPrice
            ? formatPrice(price)
            : isLoading
              ? '--'
              : '--'}
      </MotionText>

      <Text w="64px" textAlign="right" color={isFeedError ? 'red' : deltaColor}>
        {isFeedError
          ? '--'
          : hasDelta
            ? `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}%`
            : '--'}
      </Text>
    </Flex>
  );
}

function formatPrice(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}
