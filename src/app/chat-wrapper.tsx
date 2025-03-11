'use client';

import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled for components that use browser APIs
const ChatContainer = dynamic(
  () => import('../components/chat/chat-container').then(mod => ({ default: mod.ChatContainer })),
  { ssr: false }
);

export default function ChatWrapper() {
  return <ChatContainer />;
}
