import { Box } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { springConfig, tabPanelVariants } from '@/animations';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ModeTabs } from '@/components/tabs/ModeTabs';
import { SwapTab } from '@/components/tabs/SwapTab';
import { IntentTab } from '@/components/tabs/IntentTab';
import { QuotesTab } from '@/components/tabs/QuotesTab';
import { GaslessTab } from '@/components/tabs/GaslessTab';
import { useAppStore } from '@/stores/appStore';

const MotionBox = motion(Box);

/**
 * Main panel with mode tabs and active content.
 */
export function MainPanel() {
  const activeTab = useAppStore((state) => state.activeTab);

  return (
    <Box h="100%" display="flex" flexDirection="column" minW={0} overflow="hidden">
      <ModeTabs />
      <Box flex="1" minH={0} overflowY="auto">
        <AnimatePresence mode="wait">
          <MotionBox
            key={activeTab}
            variants={tabPanelVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            transition={springConfig.stiff}
            h="100%"
          >
            {activeTab === 'swap' ? (
              <ErrorBoundary>
                <SwapTab />
              </ErrorBoundary>
            ) : null}
            {activeTab === 'intent' ? (
              <ErrorBoundary>
                <IntentTab />
              </ErrorBoundary>
            ) : null}
            {activeTab === 'quotes' ? (
              <ErrorBoundary>
                <QuotesTab />
              </ErrorBoundary>
            ) : null}
            {activeTab === 'gasless' ? (
              <ErrorBoundary>
                <GaslessTab />
              </ErrorBoundary>
            ) : null}
          </MotionBox>
        </AnimatePresence>
      </Box>
    </Box>
  );
}
