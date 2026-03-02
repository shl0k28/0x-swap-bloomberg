import { Box, Grid, GridItem, useBreakpointValue, useDisclosure } from '@chakra-ui/react';
import { CommandPalette } from '@/components/common/CommandPalette';
import { SuccessBar } from '@/components/common/SuccessBar';
import { MobileBottomToolbar, MobileDrawer } from '@/layout/mobile/MobileDrawer';
import { LeftSidebar } from '@/layout/panels/LeftSidebar';
import { MainPanel } from '@/layout/panels/MainPanel';
import { BottomPanel } from '@/layout/panels/BottomPanel';
import { TerminalStatusbar } from '@/layout/statusbar/TerminalStatusbar';
import { TerminalTopbar } from '@/layout/topbar/TerminalTopbar';
import { useAppStore } from '@/stores/appStore';

/**
 * Full-screen terminal shell with fixed responsive grid layout.
 */
export function TerminalShell() {
  const successMessage = useAppStore((state) => state.successMessage);
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false;
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Grid
      h="100%"
      w="100%"
      className="terminal-grid-bg terminal-no-overflow-x"
      templateColumns={{ base: '1fr', md: '200px 1fr', lg: '260px 1fr' }}
      templateRows="44px 1fr 24px"
      columnGap={0}
      rowGap={0}
      bg="bgVoid"
      overflow="hidden"
    >
      <GridItem colSpan={{ base: 1, md: 2 }} rowStart={1}>
        <TerminalTopbar />
      </GridItem>

      <GridItem
        rowStart={2}
        colStart={1}
        borderRight={{ base: 'none', md: '1px solid' }}
        borderColor="border"
        bg="bgBase"
        display={{ base: 'none', md: 'block' }}
        overflow="hidden"
      >
        <LeftSidebar />
      </GridItem>

      <GridItem rowStart={2} colStart={{ base: 1, md: 2 }} minW={0} overflow="hidden">
        <Grid h="100%" templateRows="1fr auto" overflow="hidden">
          <Box minH={0} overflowY="auto" pb={{ base: '52px', md: 0 }}>
            <MainPanel />
          </Box>
          <Box borderTop="1px solid" borderColor="border" flexShrink={0}>
            <BottomPanel />
          </Box>
        </Grid>
      </GridItem>

      <GridItem colSpan={{ base: 1, md: 2 }} rowStart={3}>
        <TerminalStatusbar />
      </GridItem>

      {isMobile ? <MobileBottomToolbar onOpenMenu={onOpen} /> : null}
      <MobileDrawer isOpen={isOpen} onClose={onClose} />
      <SuccessBar message={successMessage} />
      <CommandPalette />
    </Grid>
  );
}
