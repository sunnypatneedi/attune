'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/lib/store';

export function useKeyboardShortcuts() {
  const { toggleSidebar, toggleInfoPanel } = useChatStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      // Cmd+B: Toggle sidebar
      if (isMeta && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }

      // Cmd+I: Toggle info panel
      if (isMeta && e.key === 'i') {
        e.preventDefault();
        toggleInfoPanel();
      }

      // Cmd+Shift+N: New conversation
      if (isMeta && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        // Click the new chat button
        const btn = document.querySelector('[aria-label="New chat"]') as HTMLButtonElement;
        btn?.click();
      }

      // / : Focus composer (when not in an input)
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        const active = document.activeElement;
        const isInput =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active?.getAttribute('contenteditable') === 'true';
        if (!isInput) {
          e.preventDefault();
          const textarea = document.querySelector('[aria-label="Message input"]') as HTMLTextAreaElement;
          textarea?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, toggleInfoPanel]);
}
