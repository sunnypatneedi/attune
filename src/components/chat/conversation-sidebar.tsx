'use client';

import { useChatStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { MessageSquare, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  createConversation,
  deleteConversation,
  renameConversation,
} from '@/app/chat/actions';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

export function ConversationSidebar() {
  const {
    conversations,
    activeConversationId,
    addConversation,
    removeConversation,
    updateConversationTitle,
    setActiveConversation,
    setSidebarOpen,
  } = useChatStore();
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleNewChat = useCallback(async () => {
    const convo = await createConversation();
    addConversation({ id: convo.id, title: convo.title, updatedAt: convo.updatedAt });
    setActiveConversation(convo.id);
    router.push(`/chat/${convo.id}`);
  }, [addConversation, setActiveConversation, router]);

  const handleSelect = useCallback(
    (id: string) => {
      setActiveConversation(id);
      router.push(`/chat/${id}`);
      // Close sidebar on mobile
      if (window.innerWidth < 640) {
        setSidebarOpen(false);
      }
    },
    [setActiveConversation, router, setSidebarOpen]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteConversation(id);
      removeConversation(id);
      if (activeConversationId === id) {
        router.push('/chat');
      }
    },
    [removeConversation, activeConversationId, router]
  );

  const startEditing = useCallback((id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  }, []);

  const saveEdit = useCallback(
    async (id: string) => {
      const trimmed = editTitle.trim();
      if (trimmed) {
        await renameConversation(id, trimmed);
        updateConversationTitle(id, trimmed);
      }
      setEditingId(null);
    },
    [editTitle, updateConversationTitle]
  );

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full border-r bg-muted/30">
      <div className="p-3 border-b">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleNewChat}
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.map((convo) => (
            <div
              key={convo.id}
              className={cn(
                'group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors',
                activeConversationId === convo.id
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'
              )}
              onClick={() => editingId !== convo.id && handleSelect(convo.id)}
            >
              <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />

              {editingId === convo.id ? (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(convo.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="h-6 text-xs"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0"
                    onClick={(e) => { e.stopPropagation(); saveEdit(convo.id); }}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0"
                    onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{convo.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatDate(convo.updatedAt)}
                    </p>
                  </div>

                  <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(convo.id, convo.title);
                      }}
                      aria-label="Rename conversation"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Delete conversation"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this conversation and all its messages.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(convo.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </>
              )}
            </div>
          ))}

          {conversations.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No conversations yet
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
