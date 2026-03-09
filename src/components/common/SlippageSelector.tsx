import { Button, Flex, Input, Text } from '@chakra-ui/react';

const presets = ['0.1', '0.5', '1'] as const;

/**
 * Slippage presets with custom override field.
 */
export function SlippageSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Flex align="center" gap={2} wrap="wrap">
      <Text fontSize="10px" color="textSecondary" fontFamily="mono" w="64px" flexShrink={0}>
        Slippage
      </Text>
      {presets.map((preset) => (
        <Button
          key={preset}
          h="28px"
          minW="44px"
          px={2}
          borderRadius="2px"
          variant="outline"
          bg={value === preset ? 'amber' : 'transparent'}
          color={value === preset ? 'bgVoid' : 'textSecondary'}
          borderColor={value === preset ? 'amber' : 'borderBright'}
          fontFamily="mono"
          fontSize="10px"
          onClick={() => onChange(preset)}
          _hover={{
            borderColor: value === preset ? 'amber' : 'borderBright',
            bg: value === preset ? 'amber' : 'bgRaised',
            color: value === preset ? 'bgVoid' : 'textPrimary',
          }}
        >
          {preset}%
        </Button>
      ))}
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        h="28px"
        w="72px"
        borderRadius="2px"
        bg="bgSurface"
        border="1px solid"
        borderColor="borderBright"
        color="textPrimary"
        _placeholder={{ color: 'textDim' }}
        _hover={{ borderColor: 'borderBright' }}
        _focusVisible={{ borderColor: 'amberDim', boxShadow: 'none' }}
        fontFamily="mono"
        fontSize="10px"
      />
    </Flex>
  );
}
