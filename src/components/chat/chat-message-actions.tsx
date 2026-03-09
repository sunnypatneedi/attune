'use client';

import { Button } from '@/components/ui/button';
import { Check, Copy, RefreshCw, Pencil } from 'lucide-react';
import { useState, useCallback } from 'react';

interface ChatMessageActionsProps {
  messageId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
}

export function ChatMessageActions({ content, role }: ChatMessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  return (
    <div className="flex items-center gap-0.5 animate-in fade-in duration-200">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleCopy}
        aria-label="Copy message"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </Button>
      {role === 'user' && (
        <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Edit message">
          <Pencil className="h-3 w-3" />
        </Button>
      )}
      {role === 'assistant' && (
        <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Regenerate response">
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
