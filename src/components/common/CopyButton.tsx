import { IconButton } from '@chakra-ui/react';
import { useState } from 'react';
import { CopyIcon, CheckIcon } from '@chakra-ui/icons';

/**
 * Clipboard button that flashes green for 800ms after copy success.
 */
export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 800);
  };

  return (
    <IconButton
      aria-label="Copy"
      size="xs"
      icon={copied ? <CheckIcon /> : <CopyIcon />}
      borderRadius="2px"
      variant="outline"
      borderColor={copied ? 'green' : 'borderBright'}
      color={copied ? 'green' : 'textSecondary'}
      bg="transparent"
      _hover={{ borderColor: copied ? 'green' : 'amber', color: copied ? 'green' : 'amber' }}
      onClick={() => void handleClick()}
    />
  );
}
