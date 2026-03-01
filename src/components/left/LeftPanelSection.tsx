import { Box, Flex, Text, type BoxProps } from '@chakra-ui/react';
import type { ReactNode } from 'react';

/**
 * Standardized left sidebar section shell.
 */
export function LeftPanelSection({
  title,
  children,
  contentProps,
  containerProps,
}: {
  title: string;
  children: ReactNode;
  contentProps?: BoxProps;
  containerProps?: BoxProps;
}) {
  return (
    <Box
      bg="bgBase"
      border="1px solid"
      borderColor="border"
      display="flex"
      flexDir="column"
      minH={0}
      {...containerProps}
    >
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
      <Box px={3} py={2} flex="1" minH={0} {...contentProps}>
        {children}
      </Box>
    </Box>
  );
}
