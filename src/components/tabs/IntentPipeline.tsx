import { Box, Flex, Text } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { springConfig } from '@/animations';

export type PipelineStep = 'PARSING' | 'QUOTING' | 'CONFIRMING' | 'EXECUTING' | 'COMPLETE';

const MotionFlex = motion(Flex);
const MotionDot = motion(Box);

/**
 * Pipeline visualization for intent mode execution phases.
 */
export function IntentPipeline({
  currentStep,
  previews,
}: {
  currentStep: PipelineStep | null;
  previews?: Partial<Record<PipelineStep, string>>;
}) {
  const orderedSteps: PipelineStep[] = ['PARSING', 'QUOTING', 'CONFIRMING', 'EXECUTING', 'COMPLETE'];
  const stepIndex = orderedSteps.indexOf(currentStep ?? 'PARSING');

  return (
    <Box bg="bgSurface" border="1px solid" borderColor="border" borderRadius="2px" overflow="hidden">
      <AnimatePresence>
        {orderedSteps.map((step, index) => {
          const isCurrent = currentStep === step;
          const isDone = currentStep !== null && index < stepIndex;

          return (
            <MotionFlex
              key={step}
              h="28px"
              align="center"
              px={2}
              borderBottom={index < orderedSteps.length - 1 ? '1px solid' : 'none'}
              borderColor="border"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ ...springConfig.stiff, delay: index * 0.08 }}
            >
              <Text w="20px" fontFamily="mono" fontSize="9px" color="textDim">
                {index + 1}
              </Text>
              <MotionDot
                w="8px"
                h="8px"
                borderRadius="50%"
                mr={2}
                border="1px solid"
                borderColor={isDone ? 'green' : isCurrent ? 'amber' : 'textDim'}
                bg={isDone ? 'green' : 'transparent'}
                animate={
                  isCurrent && !isDone ? { scale: [0.8, 1.2], opacity: [0.7, 1] } : { scale: 1, opacity: 1 }
                }
                transition={
                  isCurrent && !isDone
                    ? { duration: 0.8, repeat: Infinity, repeatType: 'reverse' }
                    : { duration: 0.2 }
                }
              />
              <Text
                fontFamily="mono"
                fontSize="10px"
                color={isDone ? 'green' : isCurrent ? 'amber' : 'textSecondary'}
                textTransform="uppercase"
              >
                {step}
              </Text>
              <Text
                ml="auto"
                maxW="200px"
                noOfLines={1}
                fontFamily="mono"
                fontSize="10px"
                color="textPrimary"
              >
                {previews?.[step] ?? ''}
              </Text>
            </MotionFlex>
          );
        })}
      </AnimatePresence>
    </Box>
  );
}
