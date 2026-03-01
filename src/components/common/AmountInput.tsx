import { Button, Flex, Input, Text } from '@chakra-ui/react';
import { formatWithCommas, sanitizeDecimalInput } from '@/utils/number';

/**
 * Amount input row with max action and optional USD hint.
 */
export function AmountInput({
  value,
  onChange,
  usdHint,
  onMax,
}: {
  value: string;
  onChange: (value: string) => void;
  usdHint?: string;
  onMax?: () => void;
}) {
  return (
    <Flex direction="column" gap={1}>
      <Flex align="center" gap={2}>
        <Input
          value={formatWithCommas(value)}
          onChange={(event) => onChange(sanitizeDecimalInput(event.target.value))}
          h="44px"
          bg="bgSurface"
          border="1px solid"
          borderColor="borderBright"
          borderRadius="2px"
          color="textPrimary"
          fontFamily="mono"
          fontSize="16px"
          _placeholder={{ color: 'textDim' }}
          _focusVisible={{ borderColor: 'amber', boxShadow: 'none' }}
        />
        {onMax ? (
          <Button
            h="24px"
            px={2}
            borderRadius="1px"
            bg="amberDim"
            color="amber"
            fontFamily="mono"
            fontSize="9px"
            textTransform="uppercase"
            onClick={onMax}
          >
            MAX
          </Button>
        ) : null}
      </Flex>
      <Text fontSize="10px" color="textDim" fontFamily="mono">
        {usdHint ?? '$--'}
      </Text>
    </Flex>
  );
}
