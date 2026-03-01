import { Box, Flex, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

/**
 * Standardized left sidebar section shell.
 */
export function LeftPanelSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Box bg="bgBase" border="1px solid" borderColor="border">
      <Flex
        h="28px"
        align="center"
        px={3}
        borderBottom="1px solid"
        borderColor="border"
      >
        <Text
          fontFamily="mono"
          fontSize="9px"
          letterSpacing="0.15em"
          textTransform="uppercase"
          color="textDim"
        >
          {title}
        </Text>
      </Flex>
      <Box px={3} py={2}>
        {children}
      </Box>
    </Box>
  );
}
