import { Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

const frames = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'] as const;

/**
 * Braille spinner used for asynchronous terminal operations.
 */
export function BrailleSpinner({
  label,
  color = 'amber',
}: {
  label?: string;
  color?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const handle = window.setInterval(() => {
      setIndex((previous) => (previous + 1) % frames.length);
    }, 90);

    return () => window.clearInterval(handle);
  }, []);

  return (
    <Text color={color} fontFamily="mono" fontSize="10px">
      {frames[index]} {label ?? ''}
    </Text>
  );
}
