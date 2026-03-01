import { Flex, Text, useToken } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { AnimatedNumber } from '@/components/common/AnimatedNumber';
import { BrailleSpinner } from '@/components/common/BrailleSpinner';
import { LeftPanelSection } from '@/components/left/LeftPanelSection';
import { useTickerRows } from '@/hooks/useTickerRows';
import { toSignedPercent } from '@/utils/number';

const MotionText = motion(Text);

/**
 * Live market ticker shown at top of left panel.
 */
export function PriceTickerPanel() {
  const { rows, loading } = useTickerRows();
  const [amberColor, textDimColor, textPrimaryColor] = useToken('colors', [
    'amber',
    'textDim',
    'textPrimary',
  ]);

  return (
    <LeftPanelSection title="PRICE TICKER">
      {loading ? <BrailleSpinner label="loading markets" /> : null}

      <Flex direction="column">
        {rows.map((row, index) => (
          <TickerRow
            key={`${row.symbol}-${row.quoteSymbol}`}
            symbol={row.symbol}
            price={row.price}
            changePct={row.changePct}
            isStale={row.isStale}
            hasDivider={index < rows.length - 1}
            amberColor={amberColor}
            textDimColor={textDimColor}
            textPrimaryColor={textPrimaryColor}
          />
        ))}
      </Flex>
    </LeftPanelSection>
  );
}

function TickerRow({
  symbol,
  price,
  changePct,
  isStale,
  hasDivider,
  amberColor,
  textDimColor,
  textPrimaryColor,
}: {
  symbol: string;
  price: number;
  changePct: number;
  isStale?: boolean;
  hasDivider: boolean;
  amberColor: string;
  textDimColor: string;
  textPrimaryColor: string;
}) {
  const previousRef = useRef<number | null>(null);
  const [flashUpdate, setFlashUpdate] = useState(false);

  useEffect(() => {
    if (previousRef.current !== null && previousRef.current !== price) {
      setFlashUpdate(true);
      const timer = window.setTimeout(() => setFlashUpdate(false), 600);
      previousRef.current = price;
      return () => window.clearTimeout(timer);
    }
    previousRef.current = price;
    return undefined;
  }, [price]);

  const deltaColor = changePct > 0 ? 'green' : changePct < 0 ? 'red' : 'textDim';

  return (
    <Flex
      h="26px"
      align="center"
      borderBottom={hasDivider ? '1px solid' : 'none'}
      borderColor="border"
      fontFamily="mono"
      fontSize="10px"
    >
      <Text w="36px" color="amber">
        {symbol}
      </Text>

      <MotionText
        flex="1"
        textAlign="right"
        color={isStale ? 'textDim' : 'textPrimary'}
        animate={{
          color: flashUpdate ? amberColor : isStale ? textDimColor : textPrimaryColor,
        }}
        transition={{ duration: 0.6 }}
      >
        {price > 0 ? <AnimatedNumber value={price} fractionDigits={4} /> : '--'}
      </MotionText>

      <Text w="54px" textAlign="right" color={isStale ? 'textDim' : deltaColor}>
        {isStale ? '--' : toSignedPercent(changePct)}
      </Text>
    </Flex>
  );
}
