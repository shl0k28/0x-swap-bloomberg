import { Box, Text } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { springConfig } from '@/animations';

const MotionBox = motion(Box);

/**
 * Bottom success banner shown after successful swaps.
 */
export function SuccessBar({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message ? (
        <MotionBox
          pos="fixed"
          left="50%"
          bottom="30px"
          transform="translateX(-50%)"
          bg="green"
          color="bgVoid"
          px={4}
          py={2}
          border="1px solid"
          borderColor="green"
          zIndex={1500}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0 }}
          transition={springConfig.gentle}
        >
          <Text fontFamily="mono" fontSize="10px" textTransform="uppercase" letterSpacing="0.1em">
            {message}
          </Text>
        </MotionBox>
      ) : null}
    </AnimatePresence>
  );
}
