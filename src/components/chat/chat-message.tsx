'use client';

import { cn } from '@/lib/utils';
import { ChatMessageContent } from './chat-message-content';
import { ChatMessageActions } from './chat-message-actions';
import { ChatContextIndicator } from './chat-context-indicator';
import { type MessageInsight } from '@/lib/store';
import { Bot, User } from 'lucide-react';
import { useState } from 'react';

interface ChatMessageComponentProps {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
  createdAt: Date;
  insight?: MessageInsight;
}

export function ChatMessageComponent({
  id,
  role,
  content,
  isStreaming = false,
  createdAt,
  insight,
}: ChatMessageComponentProps) {
  const [showActions, setShowActions] = useState(false);
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';

  return (
    <div
      className={cn(
        'group flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300',
        isUser && 'flex-row-reverse'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className={cn('flex flex-col gap-1 max-w-[80%]', isUser && 'items-end')}>
        {/* Context indicator — shown above assistant messages */}
        {isAssistant && insight && !isStreaming && (
          <ChatContextIndicator insight={insight} />
        )}

        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted rounded-tl-sm'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <>
              <ChatMessageContent content={content} />
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-0.5 bg-current animate-pulse rounded-sm" />
              )}
            </>
          )}
        </div>

        {/* Timestamp + actions */}
        <div className={cn('flex items-center gap-2 px-1', isUser && 'flex-row-reverse')}>
          <time
            className="text-xs text-muted-foreground"
            dateTime={createdAt.toISOString()}
          >
            {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </time>
          {showActions && !isStreaming && (
            <ChatMessageActions messageId={id} content={content} role={role} />
          )}
        </div>
      </div>
    </div>
  );
}
