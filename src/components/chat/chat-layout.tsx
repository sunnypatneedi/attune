'use client';

import { useEffect } from 'react';
import { useChatStore, type ConversationSummary } from '@/lib/store';
import { ConversationSidebar } from './conversation-sidebar';
import { ChatHeader } from './chat-header';
import { InfoPanel } from './info-panel';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { CommandPalette } from './command-palette';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

interface ChatLayoutProps {
  initialConversations: ConversationSummary[];
  children: React.ReactNode;
}

export function ChatLayout({ initialConversations, children }: ChatLayoutProps) {
  const {
    sidebarOpen,
    infoPanelOpen,
    setSidebarOpen,
    setConversations,
  } = useChatStore();
  const isMobile = useIsMobile();

  useKeyboardShortcuts();

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations, setConversations]);

  // Initialize theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile, setSidebarOpen]);

  // Mobile: sidebar/info panel as sheets
  if (isMobile) {
    return (
      <div className="flex flex-col h-dvh bg-background">
        <CommandPalette />
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <ConversationSidebar />
          </SheetContent>
        </Sheet>

        <ChatHeader />
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  // Desktop: resizable panels
  return (
    <div className="flex h-dvh bg-background">
      <CommandPalette />
      <ResizablePanelGroup direction="horizontal">
        {sidebarOpen && (
          <>
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <ConversationSidebar />
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        <ResizablePanel defaultSize={infoPanelOpen ? 55 : 80}>
          <div className="flex flex-col h-full">
            <ChatHeader />
            <main className="flex-1 flex flex-col overflow-hidden">
              {children}
            </main>
          </div>
        </ResizablePanel>

        {infoPanelOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
              <InfoPanel />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
