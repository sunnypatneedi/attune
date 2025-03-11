import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface MessageProps {
  content: string;
  sender: 'user' | 'bot';
  timestamp?: number;
  isNew?: boolean;
}

export function Message({ content, sender, timestamp, isNew = false }: MessageProps) {
  const isUser = sender === 'user';
  const formattedTime = timestamp 
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : '';

  return (
    <div 
      className={cn(
        'flex w-full mb-4 animate-in fade-in slide-in-from-bottom-4 duration-300',
        isUser ? 'justify-end' : 'justify-start',
        isNew && 'opacity-80'
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src="/bot-avatar.png" alt="Bot" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn('flex flex-col max-w-[80%]', isUser ? 'items-end' : 'items-start')}>
        <Card 
          className={cn(
            'mb-1',
            isUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted'
          )}
        >
          <CardContent className="p-3 text-sm">
            {content}
          </CardContent>
        </Card>
        
        <span className="text-xs text-muted-foreground px-2">
          {formattedTime}
        </span>
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 ml-2">
          <AvatarImage src="/user-avatar.png" alt="User" />
          <AvatarFallback>Me</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-center space-x-2 mb-4">
      <Avatar className="h-8 w-8">
        <AvatarFallback>AI</AvatarFallback>
      </Avatar>
      
      <Card className="bg-muted">
        <CardContent className="p-3 flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: '300ms' }} />
        </CardContent>
      </Card>
    </div>
  );
}
