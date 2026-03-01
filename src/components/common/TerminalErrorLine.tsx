import { Text } from '@chakra-ui/react';

/**
 * Inline terminal-style error text.
 */
export function TerminalErrorLine({ message }: { message: string }) {
  return (
    <Text fontFamily="Iosevka Fixed, Iosevka, monospace" fontSize="sm" color="red">
      [ERROR] {message}
    </Text>
  );
}
