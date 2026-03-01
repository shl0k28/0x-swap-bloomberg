import { Flex, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { LeftPanelSection } from '@/components/left/LeftPanelSection';
import { useAppStore } from '@/stores/appStore';
import { useHistoryStore } from '@/stores/historyStore';
import { getExplorerTxUrl } from '@/utils/explorer';
import { toTimeAgo } from '@/utils/time';

const MotionText = motion(Text);

/**
 * Transaction history panel for executed swaps.
 */
export function TxHistoryPanel() {
  const chainId = useAppStore((state) => state.selectedChainId);
  const transactions = useHistoryStore((state) => state.transactions);

  return (
    <LeftPanelSection title="TX HISTORY">
      <Flex direction="column" gap={1}>
        {transactions.length === 0 ? (
          <Text
            py={3}
            textAlign="center"
            fontFamily="mono"
            fontSize="10px"
            color="textDim"
            fontStyle="italic"
          >
            no transactions yet
          </Text>
        ) : null}

        {transactions.map((transaction) => {
          const statusColor =
            transaction.status === 'CONFIRMED'
              ? 'green'
              : transaction.status === 'FAILED'
                ? 'red'
                : 'amber';

          return (
            <Flex
              key={transaction.id}
              align="center"
              justify="space-between"
              gap={2}
              fontFamily="mono"
              cursor="pointer"
              onClick={() => window.open(getExplorerTxUrl(chainId, transaction.hash), '_blank', 'noopener,noreferrer')}
            >
              <Text fontSize="9px" color="cyan" minW="54px">
                {transaction.type}
              </Text>
              <Text fontSize="10px" color="textPrimary" flex="1" noOfLines={1}>
                {transaction.pair}
              </Text>
              <Text fontSize="9px" color="textSecondary" minW="52px" textAlign="right" noOfLines={1}>
                {transaction.amount}
              </Text>
              <MotionText
                fontSize="9px"
                color={statusColor}
                minW="56px"
                textAlign="right"
                animate={transaction.status === 'PENDING' ? { opacity: [0.5, 1] } : { opacity: 1 }}
                transition={
                  transaction.status === 'PENDING'
                    ? { duration: 0.8, repeat: Infinity, repeatType: 'reverse' }
                    : { duration: 0.2 }
                }
              >
                {transaction.status}
              </MotionText>
              <Text fontSize="9px" color="textDim">
                {toTimeAgo(transaction.createdAt)}
              </Text>
            </Flex>
          );
        })}
      </Flex>
    </LeftPanelSection>
  );
}
