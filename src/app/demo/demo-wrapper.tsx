'use client';

import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled for components that use browser APIs
const EnhancedChatDemo = dynamic(
  () => import('../../components/demo/enhanced-chat-demo').then(mod => ({ default: mod.default })),
  { ssr: false }
);

export default function DemoWrapper() {
  return <EnhancedChatDemo />;
}
