import { Box, Text } from '@chakra-ui/react';

/**
 * Inline terminal-style error text.
 */
export function TerminalErrorLine({ message }: { message: string }) {
  return (
    <Box
      maxW="100%"
      bg="bgSurface"
      border="1px solid"
      borderColor="red"
      borderRadius="2px"
      px={2}
      py={1.5}
    >
      <Text
        fontFamily="Iosevka Fixed, Iosevka, monospace"
        fontSize="10px"
        lineHeight="1.45"
        color="red"
        whiteSpace="pre-wrap"
        wordBreak="break-word"
      >
        [ERROR] {message}
      </Text>
    </Box>
  );
}
