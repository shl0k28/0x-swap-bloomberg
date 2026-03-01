import { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';

/**
 * Registers global keyboard shortcuts for terminal navigation.
 */
export function useKeyboardShortcuts() {
  const setOpen = useAppStore((state) => state.setCommandPaletteOpen);

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [setOpen]);
}
