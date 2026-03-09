import { getConversations } from './actions';
import { ChatLayout } from '@/components/chat/chat-layout';

export default async function ChatRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const conversations = await getConversations();

  return (
    <ChatLayout initialConversations={conversations}>
      {children}
    </ChatLayout>
  );
}
