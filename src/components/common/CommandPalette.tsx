import {
  Box,
  Flex,
  Input,
  List,
  ListItem,
  Portal,
  Text,
  useOutsideClick,
} from '@chakra-ui/react';
import { useMemo, useRef, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useHistoryStore } from '@/stores/historyStore';

interface PaletteAction {
  id: string;
  label: string;
  run: () => void;
}

/**
 * Command palette opened with Cmd+K for tab switching and intent recall.
 */
export function CommandPalette() {
  const open = useAppStore((state) => state.commandPaletteOpen);
  const setOpen = useAppStore((state) => state.setCommandPaletteOpen);
  const setTab = useAppStore((state) => state.setActiveTab);
  const setIntentInput = useAppStore((state) => state.setIntentInput);
  const recentIntents = useHistoryStore((state) => state.recentIntents);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useOutsideClick({
    ref: rootRef,
    handler: () => setOpen(false),
  });

  const actions = useMemo<PaletteAction[]>(() => {
    const tabActions: PaletteAction[] = [
      { id: 'tab-swap', label: 'Go to SWAP tab', run: () => setTab('swap') },
      { id: 'tab-intent', label: 'Go to INTENT tab', run: () => setTab('intent') },
      { id: 'tab-quotes', label: 'Go to QUOTES tab', run: () => setTab('quotes') },
      { id: 'tab-gasless', label: 'Go to GASLESS tab', run: () => setTab('gasless') },
    ];

    const intentActions = recentIntents.map((intent, index) => ({
      id: `intent-${index}`,
      label: `Use intent: ${intent}`,
      run: () => {
        setTab('intent');
        setIntentInput(intent);
      },
    }));

    return [...tabActions, ...intentActions];
  }, [recentIntents, setIntentInput, setTab]);

  const filtered = actions.filter((action) =>
    action.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  if (!open) {
    return null;
  }

  return (
    <Portal>
      <Flex
        pos="fixed"
        inset={0}
        bg="rgba(8,8,13,0.92)"
        align="flex-start"
        justify="center"
        zIndex={1600}
        pt={24}
      >
        <Box
          ref={rootRef}
          w={{ base: 'calc(100vw - 24px)', md: '640px' }}
          bg="bgBase"
          border="1px solid"
          borderColor="borderBright"
          p={3}
        >
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Command..."
            h="34px"
            borderRadius="2px"
            bg="bgSurface"
            border="1px solid"
            borderColor="border"
            fontFamily="mono"
            fontSize="10px"
            color="textPrimary"
            _placeholder={{ color: 'textDim' }}
            _focusVisible={{ borderColor: 'amberDim', boxShadow: 'none' }}
            mb={2}
          />
          <List maxH="320px" overflowY="auto">
            {filtered.map((action) => (
              <ListItem
                key={action.id}
                p={2}
                borderRadius="2px"
                _hover={{ bg: 'bgRaised' }}
                cursor="pointer"
                onClick={() => {
                  action.run();
                  setOpen(false);
                  setQuery('');
                }}
              >
                <Text fontFamily="mono" fontSize="10px" color="textSecondary">
                  {action.label}
                </Text>
              </ListItem>
            ))}
          </List>
        </Box>
      </Flex>
    </Portal>
  );
}
