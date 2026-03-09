'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useChatStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { createConversation } from '@/app/chat/actions';
import {
  MessageSquare,
  Plus,
  PanelLeft,
  PanelRight,
  Sun,
  Moon,
  Keyboard,
} from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    conversations,
    toggleSidebar,
    toggleInfoPanel,
    addConversation,
    setActiveConversation,
  } = useChatStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNewChat = useCallback(async () => {
    setOpen(false);
    const convo = await createConversation();
    addConversation({ id: convo.id, title: convo.title, updatedAt: convo.updatedAt });
    setActiveConversation(convo.id);
    router.push(`/chat/${convo.id}`);
  }, [addConversation, setActiveConversation, router]);

  const handleSelectConvo = useCallback(
    (id: string) => {
      setOpen(false);
      setActiveConversation(id);
      router.push(`/chat/${id}`);
    },
    [setActiveConversation, router]
  );

  const toggleTheme = useCallback(() => {
    setOpen(false);
    const isDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', !isDark);
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search conversations, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={handleNewChat}>
            <Plus className="mr-2 h-4 w-4" />
            New conversation
          </CommandItem>
          <CommandItem onSelect={() => { setOpen(false); toggleSidebar(); }}>
            <PanelLeft className="mr-2 h-4 w-4" />
            Toggle sidebar
            <span className="ml-auto text-xs text-muted-foreground">Cmd+B</span>
          </CommandItem>
          <CommandItem onSelect={() => { setOpen(false); toggleInfoPanel(); }}>
            <PanelRight className="mr-2 h-4 w-4" />
            Toggle info panel
            <span className="ml-auto text-xs text-muted-foreground">Cmd+I</span>
          </CommandItem>
          <CommandItem onSelect={toggleTheme}>
            <Sun className="mr-2 h-4 w-4 dark:hidden" />
            <Moon className="mr-2 h-4 w-4 hidden dark:block" />
            Toggle theme
          </CommandItem>
        </CommandGroup>

        {conversations.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Conversations">
              {conversations.slice(0, 10).map((convo) => (
                <CommandItem
                  key={convo.id}
                  onSelect={() => handleSelectConvo(convo.id)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {convo.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Help">
          <CommandItem disabled>
            <Keyboard className="mr-2 h-4 w-4" />
            <span className="text-xs text-muted-foreground">
              Cmd+K: Command palette | Cmd+B: Sidebar | Cmd+I: Info panel | /: Focus input
            </span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
