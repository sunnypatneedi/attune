'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useChatStore, type ChatMessage, type MessageInsight } from '@/lib/store';
import { ChatMessages } from './chat-messages';
import { ChatComposer } from './chat-composer';
import { ChatScrollAnchor } from './chat-scroll-anchor';
import { createMessage, generateTitle } from '@/app/chat/actions';
import { streamSimulatedResponse } from '@/lib/ai/simulated-response';
import { EnhancedUnderstandingFramework } from '@/lib/enhanced-understanding-framework';
import { IntentionType } from '@/lib/enhanced-types';
import { v4 as uuidv4 } from 'uuid';
import { useSearchParams } from 'next/navigation';

/** Convert IntentionType enum value to a human-readable label */
function intentionLabel(type: IntentionType | string): string {
  const labels: Record<string, string> = {
    question_factual: 'factual question',
    question_opinion: 'seeking opinion',
    question_clarification: 'clarification',
    request_action: 'action request',
    suggest_action: 'suggestion',
    command: 'direct request',
    greeting: 'greeting',
    farewell: 'farewell',
    gratitude: 'thanks',
    apology: 'apology',
    agreement: 'agreement',
    disagreement: 'disagreement',
    express_positive: 'positive',
    express_negative: 'concern',
    express_neutral: 'neutral',
    feedback_positive: 'positive feedback',
    feedback_negative: 'negative feedback',
    topic_switch: 'topic change',
    meta_communication: 'meta-conversation',
  };
  return labels[type] || type;
}

interface ChatViewProps {
  conversationId: string;
  initialMessages: Array<{
    id: string;
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    status: string;
    metadata: unknown;
    createdAt: Date;
  }>;
}

export function ChatView({ conversationId, initialMessages }: ChatViewProps) {
  const {
    messages,
    setMessages,
    addMessage,
    setActiveConversation,
    isGenerating,
    startStreaming,
    appendStreamContent,
    finishStreaming,
    cancelStreaming,
    streamingContent,
    streamingMessageId,
    messageInsights,
    setMessageInsight,
    clearInsights,
    mode,
    model,
    updateConversationTitle,
  } = useChatStore();

  const abortRef = useRef<AbortController | null>(null);
  const initializedRef = useRef(false);
  const frameworkRef = useRef<EnhancedUnderstandingFramework | null>(null);
  const searchParams = useSearchParams();

  // Lazily initialize the understanding framework
  const getFramework = useCallback(() => {
    if (!frameworkRef.current) {
      frameworkRef.current = new EnhancedUnderstandingFramework();
    }
    return frameworkRef.current;
  }, []);

  // Load initial messages and replay them through the framework for context
  useEffect(() => {
    setActiveConversation(conversationId);
    clearInsights();

    const framework = getFramework();
    framework.reset();

    const mapped: ChatMessage[] = initialMessages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      content: m.content,
      status: m.status as 'streaming' | 'complete' | 'error',
      createdAt: new Date(m.createdAt),
    }));
    setMessages(mapped);

    // Replay existing messages through the framework to rebuild context
    for (let i = 0; i < initialMessages.length; i++) {
      const m = initialMessages[i];
      if (m.role === 'user') {
        framework.processUserMessage(m.content);

        // Attach the insight to the next assistant message (if it exists)
        const nextMsg = initialMessages[i + 1];
        if (nextMsg && nextMsg.role === 'assistant') {
          const serialized = framework.serializeContext();
          const insight: MessageInsight = {
            entities: serialized.entities,
            intentions: serialized.intentions.map((intent) => ({
              ...intent,
              label: intentionLabel(intent.type),
            })),
            activeTopics: serialized.activeTopics,
            dominantSentiment: serialized.dominantSentiment,
            patterns: serialized.patterns,
            messageCount: serialized.messageCount,
          };
          setMessageInsight(nextMsg.id, insight);
        }
      } else if (m.role === 'assistant') {
        framework.processSystemMessage(m.content);
      }
    }
  }, [conversationId, initialMessages, setMessages, setActiveConversation, getFramework, clearInsights, setMessageInsight]);

  // Handle initial query from URL
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const q = searchParams.get('q');
    if (q && initialMessages.length === 0) {
      window.history.replaceState({}, '', `/chat/${conversationId}`);
      handleSend(q);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = useCallback(async (content: string) => {
    if (isGenerating) return;

    // Process through understanding framework
    const framework = getFramework();
    framework.processUserMessage(content);
    const serialized = framework.serializeContext();

    // Build the insight for the upcoming assistant message
    const insight: MessageInsight = {
      entities: serialized.entities,
      intentions: serialized.intentions.map((intent) => ({
        ...intent,
        label: intentionLabel(intent.type),
      })),
      activeTopics: serialized.activeTopics,
      dominantSentiment: serialized.dominantSentiment,
      patterns: serialized.patterns,
      messageCount: serialized.messageCount,
    };

    // Add user message
    const userMsg: ChatMessage = {
      id: uuidv4(),
      conversationId,
      role: 'user',
      content,
      status: 'complete',
      createdAt: new Date(),
    };
    addMessage(userMsg);

    // Save to DB
    await createMessage({
      conversationId,
      role: 'user',
      content,
    });

    // Generate title from first message
    const currentMessages = useChatStore.getState().messages;
    if (currentMessages.filter((m) => m.role === 'user').length === 1) {
      const title = content.length > 50 ? content.slice(0, 47) + '...' : content;
      updateConversationTitle(conversationId, title);
      generateTitle(conversationId, content);
    }

    // Create placeholder assistant message
    const assistantId = uuidv4();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      conversationId,
      role: 'assistant',
      content: '',
      status: 'streaming',
      createdAt: new Date(),
    };
    addMessage(assistantMsg);
    startStreaming(assistantId);

    // Attach understanding insight to the assistant message
    setMessageInsight(assistantId, insight);

    if (mode === 'simulated') {
      // Simulated streaming — pass understanding context for richer responses
      let fullContent = '';
      for await (const chunk of streamSimulatedResponse(content, serialized)) {
        fullContent += chunk;
        appendStreamContent(chunk);
      }
      finishStreaming(fullContent);

      // Feed the assistant response back into the framework
      framework.processSystemMessage(fullContent);

      await createMessage({
        conversationId,
        role: 'assistant',
        content: fullContent,
      });
    } else {
      // AI mode — send understanding context to enrich the system prompt
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const allMessages = useChatStore.getState().messages
          .filter((m) => m.status === 'complete' && m.role !== 'system')
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: allMessages,
            model,
            conversationId,
            understandingContext: serialized,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          // Check if blocked by SPEAR security
          if (res.headers.get('X-Spear-Blocked') === 'true') {
            const data = await res.json();
            finishStreaming(
              `I noticed something unusual in that message and flagged it for safety. ${data.reason || 'Please try rephrasing your request.'}`
            );
            framework.processSystemMessage('Message flagged by security policy.');
            return;
          }
          throw new Error('AI request failed');
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value, { stream: true });
            fullContent += text;
            appendStreamContent(text);
          }
        }
        finishStreaming(fullContent);

        // Feed response back into framework
        framework.processSystemMessage(fullContent);
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          cancelStreaming();
        } else {
          // Fallback to simulated mode on error
          cancelStreaming();
          console.error('AI request failed, falling back to simulated mode:', err);

          startStreaming(assistantId);
          let fallbackContent = '';
          for await (const chunk of streamSimulatedResponse(content, serialized)) {
            fallbackContent += chunk;
            appendStreamContent(chunk);
          }
          finishStreaming(fallbackContent);
          framework.processSystemMessage(fallbackContent);

          await createMessage({
            conversationId,
            role: 'assistant',
            content: fallbackContent,
          });
        }
      } finally {
        abortRef.current = null;
      }
    }
  }, [
    isGenerating, conversationId, mode, model, addMessage,
    startStreaming, appendStreamContent, finishStreaming, cancelStreaming,
    updateConversationTitle, getFramework, setMessageInsight,
  ]);

  const handleStop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    } else {
      cancelStreaming();
    }
  }, [cancelStreaming]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto" id="messages-container">
        <ChatMessages
          messages={messages}
          streamingMessageId={streamingMessageId}
          streamingContent={streamingContent}
          messageInsights={messageInsights}
        />
        <ChatScrollAnchor />
      </div>
      <ChatComposer
        onSend={handleSend}
        onStop={handleStop}
        isGenerating={isGenerating}
      />
    </div>
  );
}
