'use client';

import type { ChatMessage, MessageInsight } from '@/lib/store';
import { ChatMessageComponent } from './chat-message';

interface ChatMessagesProps {
  messages: ChatMessage[];
  streamingMessageId: string | null;
  streamingContent: string;
  messageInsights: Record<string, MessageInsight>;
}

export function ChatMessages({
  messages,
  streamingMessageId,
  streamingContent,
  messageInsights,
}: ChatMessagesProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6" role="log" aria-label="Chat messages">
      {messages.map((message) => {
        const isStreaming = message.id === streamingMessageId;
        const displayContent = isStreaming ? streamingContent : message.content;

        return (
          <ChatMessageComponent
            key={message.id}
            id={message.id}
            role={message.role}
            content={displayContent}
            isStreaming={isStreaming}
            createdAt={message.createdAt}
            insight={messageInsights[message.id]}
          />
        );
      })}
    </div>
  );
}
