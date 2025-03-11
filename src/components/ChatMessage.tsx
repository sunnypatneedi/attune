
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type ChatMessageProps = {
  message: string;
  isUser: boolean;
  intention?: string;
  entities?: Array<{ name: string; type: string }>;
  timestamp?: string;
  animationDelay?: number;
};

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isUser,
  intention,
  entities = [],
  timestamp,
  animationDelay = 0,
}) => {
  const messageClasses = isUser ? 'message-bubble-user' : 'message-bubble-system';
  const containerStyles = {
    animationDelay: `${animationDelay}ms`,
  };

  return (
    <div
      className={cn(
        "w-full max-w-3xl flex flex-col mb-6",
        isUser ? "items-end" : "items-start",
        "opacity-0 animate-fade-in"
      )}
      style={containerStyles}
    >
      <div className={cn("max-w-[85%]", isUser ? "items-end" : "items-start")}>
        <div className={messageClasses}>
          <p className="text-base leading-relaxed">{message}</p>
        </div>
        
        {(intention || entities.length > 0) && (
          <div 
            className={cn(
              "mt-2 flex flex-wrap gap-2",
              isUser ? "justify-end" : "justify-start",
              "opacity-0 animate-fade-in-delay"
            )}
          >
            {intention && (
              <div className="intention-tag">
                {intention}
              </div>
            )}
            
            {entities.map((entity, index) => (
              <div key={index} className="entity-tag">
                {entity.name} <span className="ml-1 opacity-60">({entity.type})</span>
              </div>
            ))}
          </div>
        )}
        
        {timestamp && (
          <div className={cn(
            "text-xs mt-1 text-white/50",
            isUser ? "text-right" : "text-left"
          )}>
            {timestamp}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
