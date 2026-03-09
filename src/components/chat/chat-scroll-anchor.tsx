'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import { useChatStore } from '@/lib/store';

export function ChatScrollAnchor() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const { messages, streamingContent } = useChatStore();

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAtBottom(entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Auto-scroll when new messages arrive and user is at bottom
  useEffect(() => {
    if (isAtBottom) {
      sentinelRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, isAtBottom]);

  const scrollToBottom = () => {
    sentinelRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <div ref={sentinelRef} className="h-px" />
      {!isAtBottom && (
        <div className="sticky bottom-4 flex justify-center">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full shadow-lg gap-1"
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="h-3 w-3" />
            <span className="text-xs">New messages</span>
          </Button>
        </div>
      )}
    </>
  );
}
