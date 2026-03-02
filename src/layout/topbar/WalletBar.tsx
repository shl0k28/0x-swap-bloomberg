import { Box, Button, Flex, HStack, Text } from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useBalance, useEnsName } from 'wagmi';
import { getNativeToken } from '@/constants/nativeTokens';
import { useAppStore } from '@/stores/appStore';
import { shortAddress } from '@/utils/address';

/**
 * Wallet section rendered in terminal topbar.
 */
export function WalletBar() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, openConnectModal, openAccountModal }) => {
        if (!mounted || !account || !chain) {
          return (
            <Flex align="center" gap={2}>
              <Text
                display={{ base: 'none', md: 'block' }}
                fontFamily="mono"
                fontSize="9px"
                color="textDim"
                mr={2}
                letterSpacing="0.08em"
              >
                WALLET DISCONNECTED
              </Text>
              <Button
                h="28px"
                px={3}
                variant="outline"
                borderColor="green"
                color="green"
                bg="transparent"
                fontFamily="mono"
                fontSize="10px"
                onClick={openConnectModal}
                _hover={{ bg: 'greenDim' }}
              >
                Connect Wallet
              </Button>
            </Flex>
          );
        }

        return <ConnectedWalletBar address={account.address} openAccountModal={openAccountModal} />;
      }}
    </ConnectButton.Custom>
  );
}

function ConnectedWalletBar({
  address,
  openAccountModal,
}: {
  address: string;
  openAccountModal: () => void;
}) {
  const chainId = useAppStore((state) => state.selectedChainId);
  const { data: ensName } = useEnsName({ address: address as `0x${string}` });
  const { data: balance } = useBalance({ address: address as `0x${string}`, chainId });
  const nativeSymbol = getNativeToken(chainId).symbol;
  const formattedBalance = balance ? Number(balance.formatted).toFixed(4) : '--';

  return (
    <Button
      h="28px"
      px={3}
      border="1px solid"
      borderColor="borderBright"
      bg="bgSurface"
      color="textPrimary"
      fontFamily="mono"
      fontSize="10px"
      onClick={openAccountModal}
      _hover={{ bg: 'bgRaised' }}
    >
      <HStack spacing={2}>
        <Box w="6px" h="6px" borderRadius="50%" bg="green" />
        <Text>{ensName ?? shortAddress(address)}</Text>
        <Text color="textSecondary">{`${formattedBalance} ${nativeSymbol}`}</Text>
      </HStack>
    </Button>
  );
}
