import { Box, Collapse, Text, useDisclosure } from '@chakra-ui/react';
import type { SwapIntent } from '@/types/intent';

/**
 * Collapsible parsed intent JSON view with terminal token highlighting.
 */
export function ParsedIntentViewer({ intent }: { intent: SwapIntent | null }) {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: false });

  if (!intent) {
    return null;
  }

  const lines = JSON.stringify(intent, null, 2).split('\n');

  return (
    <Box>
      <Text
        as="button"
        onClick={onToggle}
        fontFamily="mono"
        fontSize="9px"
        color="textDim"
        letterSpacing="0.1em"
        textTransform="uppercase"
      >
        {isOpen ? '▼' : '▶'} Parsed Intent
      </Text>

      <Collapse in={isOpen} animateOpacity>
        <Box mt={2} bg="bgVoid" border="1px solid" borderColor="borderBright" p={2}>
          {lines.map((line, index) => (
            <Text
              key={`${line}-${index}`}
              fontFamily="mono"
              fontSize="10px"
              whiteSpace="pre-wrap"
            >
              <JsonLine line={line} />
            </Text>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

function JsonLine({ line }: { line: string }) {
  const quoteMatch = line.match(/^\s*"[^"]+":\s*"[^"]*"?[,]?$/);
  if (quoteMatch && line.includes(':')) {
    const separator = line.indexOf(':');
    return (
      <>
        <Text as="span" color="amber">
          {line.slice(0, separator + 1)}
        </Text>
        <Text as="span" color="green">
          {line.slice(separator + 1)}
        </Text>
      </>
    );
  }

  const numberMatch = line.match(/^\s*"[^"]+":\s*\d+(\.\d+)?[,]?$/);
  if (numberMatch && line.includes(':')) {
    const separator = line.indexOf(':');
    return (
      <>
        <Text as="span" color="amber">
          {line.slice(0, separator + 1)}
        </Text>
        <Text as="span" color="cyan">
          {line.slice(separator + 1)}
        </Text>
      </>
    );
  }

  const nullMatch = line.match(/^\s*"[^"]+":\s*null[,]?$/);
  if (nullMatch && line.includes(':')) {
    const separator = line.indexOf(':');
    return (
      <>
        <Text as="span" color="amber">
          {line.slice(0, separator + 1)}
        </Text>
        <Text as="span" color="textDim">
          {line.slice(separator + 1)}
        </Text>
      </>
    );
  }

  return <Text as="span" color="textPrimary">{line}</Text>;
}
