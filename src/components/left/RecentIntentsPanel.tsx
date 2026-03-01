import { Flex, Text } from '@chakra-ui/react';
import { LeftPanelSection } from '@/components/left/LeftPanelSection';
import { useAppStore } from '@/stores/appStore';
import { useHistoryStore } from '@/stores/historyStore';

/**
 * Recent intent history with one-click rerun support.
 */
export function RecentIntentsPanel() {
  const intents = useHistoryStore((state) => state.recentIntents);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const setIntentInput = useAppStore((state) => state.setIntentInput);

  return (
    <LeftPanelSection
      title="RECENT INTENTS"
      containerProps={{ h: '100%' }}
      contentProps={{ overflowY: 'auto' }}
    >
      <Flex direction="column" gap={0.5}>
        {intents.length === 0 ? (
          <Text
            py={3}
            textAlign="center"
            fontFamily="mono"
            fontSize="10px"
            color="textDim"
            fontStyle="italic"
          >
            no intent history
          </Text>
        ) : null}

        {intents.slice(0, 5).map((intent) => (
          <Text
            key={intent}
            fontFamily="mono"
            fontSize="10px"
            color="textSecondary"
            py={1}
            cursor="pointer"
            maxW="140px"
            noOfLines={1}
            _hover={{ color: 'amber' }}
            onClick={() => {
              setIntentInput(intent);
              setActiveTab('intent');
            }}
          >
            {intent}
          </Text>
        ))}
      </Flex>
    </LeftPanelSection>
  );
}
