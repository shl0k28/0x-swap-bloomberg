import { Image } from '@chakra-ui/react';
import { memo, useEffect, useState } from 'react';
import { getFallbackLogo, getTokenLogoUrl } from '@/utils/tokenLogo';

export interface TokenLogoProps {
  address: string;
  chainId: number;
  symbol: string;
  size?: number;
}

/**
 * Memoized token logo with Trust Wallet CDN source and deterministic fallback.
 */
export const TokenLogo = memo(function TokenLogo({
  address,
  chainId,
  symbol,
  size = 18,
}: TokenLogoProps) {
  const [src, setSrc] = useState(() => getTokenLogoUrl(address, chainId));

  useEffect(() => {
    setSrc(getTokenLogoUrl(address, chainId));
  }, [address, chainId]);

  return (
    <Image
      src={src}
      alt={`${symbol} logo`}
      boxSize={`${size}px`}
      borderRadius="full"
      flexShrink={0}
      onError={() => setSrc(getFallbackLogo(symbol))}
      draggable={false}
    />
  );
});
