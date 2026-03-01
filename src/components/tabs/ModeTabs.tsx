import { Flex, Text } from '@chakra-ui/react';
import { useAppStore, type TerminalTab } from '@/stores/appStore';

const tabs: TerminalTab[] = ['swap', 'intent', 'quotes', 'gasless'];

/**
 * Main panel tab switcher with terminal-tight typography and spacing.
 */
export function ModeTabs() {
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  return (
    <Flex
      bg="bgBase"
      borderBottom="1px solid"
      borderColor="border"
      className="terminal-scroll-x"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <Flex
            key={tab}
            h="36px"
            minW={{ base: '80px', md: 'auto' }}
            px={4}
            align="center"
            justify="center"
            cursor="pointer"
            borderBottom={isActive ? '2px solid' : '2px solid transparent'}
            borderBottomColor={isActive ? 'amber' : 'transparent'}
            onClick={() => setActiveTab(tab)}
            _hover={{ color: 'textPrimary' }}
          >
            <Text
              textStyle="tabLabel"
              color={isActive ? 'amber' : 'textDim'}
              fontSize="10px"
            >
              {tab.toUpperCase()}
            </Text>
          </Flex>
        );
      })}
    </Flex>
  );
}
