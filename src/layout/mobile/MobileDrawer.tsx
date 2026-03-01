import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  IconButton,
  Text,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { springConfig } from '@/animations';
import { ChainSelector } from '@/layout/topbar/ChainSelector';
import { LeftSidebar } from '@/layout/panels/LeftSidebar';
import { useAppStore } from '@/stores/appStore';

const MotionDrawerContent = motion(DrawerContent);

/**
 * Mobile drawer with chain selector and sidebar market widgets.
 */
export function MobileDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="bottom" size="full">
      <DrawerOverlay bg="rgba(8,8,13,0.92)" />
      <MotionDrawerContent
        bg="bgBase"
        borderTop="1px solid"
        borderColor="border"
        borderRadius="0"
        maxH="75vh"
        initial={{ y: '100%' }}
        animate={{ y: isOpen ? '0%' : '100%' }}
        transition={springConfig.stiff}
      >
        <DrawerBody p={0}>
          <Box borderBottom="1px solid" borderColor="border" px={3} py={2}>
            <ChainSelector />
          </Box>
          <Box h="calc(75vh - 44px)" overflowY="auto">
            <LeftSidebar />
          </Box>
        </DrawerBody>
      </MotionDrawerContent>
    </Drawer>
  );
}

/**
 * Fixed mobile bottom toolbar for menu and wallet access.
 */
export function MobileBottomToolbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const activeTab = useAppStore((state) => state.activeTab);

  return (
    <Flex
      position="fixed"
      left={0}
      right={0}
      bottom="24px"
      h="48px"
      px={2}
      align="center"
      justify="space-between"
      bg="bgBase"
      borderTop="1px solid"
      borderColor="border"
      zIndex={1200}
    >
      <IconButton
        aria-label="Open menu"
        icon={<HamburgerIcon />}
        size="sm"
        variant="ghost"
        color="textSecondary"
        onClick={onOpenMenu}
      />

      <Text
        fontFamily="mono"
        fontSize="10px"
        textTransform="uppercase"
        letterSpacing="0.12em"
        color="amber"
      >
        {activeTab.toUpperCase()}
      </Text>

      <ConnectButton.Custom>
        {({ account, chain, mounted, openAccountModal, openConnectModal }) => {
          if (!mounted || !account || !chain) {
            return (
              <Button
                size="xs"
                h="28px"
                px={3}
                variant="outline"
                borderColor="green"
                color="green"
                fontFamily="mono"
                fontSize="10px"
                onClick={openConnectModal}
              >
                Wallet
              </Button>
            );
          }

          return (
            <Button
              size="xs"
              h="28px"
              px={3}
              variant="outline"
              borderColor="green"
              color="green"
              fontFamily="mono"
              fontSize="10px"
              onClick={openAccountModal}
            >
              Wallet
            </Button>
          );
        }}
      </ConnectButton.Custom>
    </Flex>
  );
}
