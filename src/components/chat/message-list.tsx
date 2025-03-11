import React, { useEffect, useRef, useState } from 'react';
import { Message, MessageProps, TypingIndicator } from './message';
import { useEventBus } from '@/lib/use-event-bus';
import { Database } from 'sql.js';
import { getMessages, Message as DBMessage } from '@/lib/database';

interface MessageListProps {
  db: Database | null;
}

export function MessageList({ db }: MessageListProps) {
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [typing] = useEventBus<{ type: 'typing', payload: { isTyping: boolean, sender: 'user' | 'bot' } }>('typing');
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  
  // Load initial messages from database
  useEffect(() => {
    if (!db) return;
    
    const loadedMessages = getMessages(db);
    if (loadedMessages.length > 0) {
      setMessages(
        loadedMessages.map((msg: DBMessage) => ({
          content: msg.content,
          sender: msg.sender,
          timestamp: msg.timestamp,
        }))
      );
    }
  }, [db]);
  
  // Subscribe to new messages
  useEffect(() => {
    const subscription = eventBus.subscribe(event => {
      if ((event.type === 'userMessage' || event.type === 'botMessage') && event.payload?.text) {
        const newMessage: MessageProps = {
          content: event.payload.text,
          sender: event.type === 'userMessage' ? 'user' : 'bot',
          timestamp: event.payload.timestamp || Date.now(),
          isNew: true, // Use this to animate or highlight new messages
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // After a short delay, remove the "new" flag
        setTimeout(() => {
          setMessages(prev => 
            prev.map((msg, i) => 
              i === prev.length - 1 ? { ...msg, isNew: false } : msg
            )
          );
        }, 1000);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typing?.isTyping]);
  
  return (
    <div className="flex flex-col p-4 overflow-y-auto flex-1">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>No messages yet. Start a conversation!</p>
        </div>
      ) : (
        messages.map((message, index) => (
          <Message
            key={`${message.sender}-${index}-${message.timestamp}`}
            content={message.content}
            sender={message.sender}
            timestamp={message.timestamp}
            isNew={message.isNew}
          />
        ))
      )}
      
      {typing?.isTyping && typing.sender === 'bot' && <TypingIndicator />}
      
      <div ref={endOfMessagesRef} />
    </div>
  );
}

// Import here to avoid circular dependency
import { eventBus } from '@/lib/event-bus';
