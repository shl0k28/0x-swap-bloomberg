import { Box, Text } from '@chakra-ui/react';

/**
 * Displays severity-aware price impact warnings.
 */
export function PriceImpactBanner({ impactPct }: { impactPct: number }) {
  if (impactPct <= 1) {
    return null;
  }

  const color = impactPct > 5 ? 'red' : 'amber';
  const text = impactPct > 15
    ? 'Price impact exceeds 15%. Trade is blocked for safety.'
    : impactPct > 5
      ? 'High price impact warning (>5%). Proceed carefully.'
      : 'Moderate price impact warning (>1%).';

  return (
    <Box border="1px solid" borderColor={color} borderRadius="2px" p={2}>
      <Text fontFamily="mono" color={color} fontSize="10px">
        {text} ({impactPct.toFixed(2)}%)
      </Text>
    </Box>
  );
}
