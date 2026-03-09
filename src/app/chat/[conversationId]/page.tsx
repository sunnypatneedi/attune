import { getMessages } from '../actions';
import { ChatView } from '@/components/chat/chat-view';

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const messages = await getMessages(conversationId);

  return <ChatView conversationId={conversationId} initialMessages={messages} />;
}
