import { useEffect } from 'react';

export function useKeyboardShortcuts(handlers: Record<string, () => void>) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;

      let shortcut = '';
      if (ctrl) shortcut += 'ctrl+';
      if (shift) shortcut += 'shift+';
      shortcut += key;

      const handler = handlers[shortcut];
      if (handler) {
        event.preventDefault();
        handler();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
