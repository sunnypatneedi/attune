'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Use dynamic import for client components
const ChatInterface = dynamic(
  () => import('@/components/ChatInterface'),
  { loading: () => <div className="p-8 text-center text-white">Loading chat interface...</div> }
);

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-chat-system/30 to-black/60">
      <ChatInterface />
    </main>
  );
}
