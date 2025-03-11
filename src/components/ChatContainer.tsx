'use client';

import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ChatExamples from './ChatExamples';
import { Message } from '@/hooks/use-chat-state';

type ChatContainerProps = {
  messages: Message[];
  isProcessing: boolean;
  onSendMessage: (message: string) => void;
};

const ChatContainer = ({ messages, isProcessing, onSendMessage }: ChatContainerProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex-1 flex flex-col relative">
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, index) => (
            <ChatMessage
              key={msg.id}
              message={msg.content}
              isUser={msg.isUser}
              intention={msg.intention}
              entities={msg.entities}
              timestamp={msg.timestamp}
              animationDelay={index * 100}
            />
          ))}
          <div ref={messagesEndRef}></div>
        </div>
      </div>
      
      <ChatInput 
        onSendMessage={onSendMessage} 
        disabled={isProcessing}
      />
      
      {messages.length <= 1 && (
        <ChatExamples onSendMessage={onSendMessage} />
      )}
    </div>
  );
};

export default ChatContainer;
