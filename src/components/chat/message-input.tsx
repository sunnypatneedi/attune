'use client';

import React, { KeyboardEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { dispatchTyping, dispatchUserMessage } from '@/lib/event-bus';

interface MessageInputProps {
  disabled?: boolean;
}

export function MessageInput({ disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Handle text input
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Dispatch typing indicator events, but not too frequently
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      dispatchTyping(true, 'user');
    } else if (isTyping && value.length === 0) {
      setIsTyping(false);
      dispatchTyping(false, 'user');
    }
  };
  
  // Handle sending a message
  const handleSend = () => {
    if (message.trim() === '' || disabled) return;
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      dispatchTyping(false, 'user');
    }
    
    // Dispatch the message
    dispatchUserMessage(message.trim());
    
    // Clear the input
    setMessage('');
  };
  
  // Submit on Enter (but allow Shift+Enter for new lines)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="p-4 border-t">
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="resize-none min-h-[60px]"
          disabled={disabled}
        />
        <Button 
          onClick={handleSend} 
          size="icon" 
          className="h-auto"
          disabled={disabled || message.trim() === ''}
        >
          <SendIcon className="h-5 w-5" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </div>
  );
}

// SendIcon component
function SendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  );
}
