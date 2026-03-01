import { Avatar, Center, Text } from '@chakra-ui/react';
import { useMemo, useState } from 'react';

/**
 * Token icon with deterministic fallback identicon on image errors.
 */
export function TokenAvatar({
  symbol,
  logoUri,
  size = 'sm',
}: {
  symbol: string;
  logoUri?: string;
  size?: 'xs' | 'sm' | 'md';
}) {
  const [failed, setFailed] = useState(false);

  const fallbackColor = useMemo(() => {
    let hash = 0;
    for (const char of symbol) {
      hash = char.charCodeAt(0) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue} 80% 38%)`;
  }, [symbol]);

  if (logoUri && !failed) {
    return <Avatar size={size} src={logoUri} name={symbol} onError={() => setFailed(true)} />;
  }

  return (
    <Center
      boxSize={size === 'xs' ? 5 : size === 'sm' ? 7 : 8}
      borderRadius="2px"
      border="1px solid"
      borderColor="borderBright"
      bg={fallbackColor}
    >
      <Text fontSize="10px" fontFamily="mono" color="textPrimary" fontWeight="700">
        {symbol.slice(0, 2)}
      </Text>
    </Center>
  );
}
