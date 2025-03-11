'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';

type ChatInputProps = {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  placeholder = 'Type a message...',
  disabled = false,
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="w-full p-4 glass-dark border-t border-white/10 backdrop-blur-lg">
      <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-3xl mx-auto">
        <div className="relative flex-1">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-chat-accent/50 text-white placeholder-white/40 transition-all duration-300"
            aria-label="Message input"
          />
        </div>
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="p-3 rounded-xl bg-gradient-to-r from-chat-accent to-chat-accent/80 text-background hover:shadow-button disabled:opacity-50 disabled:pointer-events-none transition-all duration-300 hover:-translate-y-0.5"
          aria-label="Send message"
        >
          <Send size={20} className="text-background" />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
