'use client';

import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status: 'streaming' | 'complete' | 'error';
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: Date;
}

/** Understanding context snapshot attached to a message at generation time */
export interface MessageInsight {
  entities: Array<{ type: string; value: string; confidence: number }>;
  intentions: Array<{ type: string; confidence: number; label: string }>;
  activeTopics: string[];
  dominantSentiment?: string;
  patterns: Array<{ type: string; description: string; confidence: number }>;
  messageCount: number;
}

interface ChatStore {
  // Conversations
  activeConversationId: string | null;
  conversations: ConversationSummary[];
  setActiveConversation: (id: string | null) => void;
  setConversations: (conversations: ConversationSummary[]) => void;
  addConversation: (conversation: ConversationSummary) => void;
  removeConversation: (id: string) => void;
  updateConversationTitle: (id: string, title: string) => void;

  // Messages
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;

  // Understanding
  messageInsights: Record<string, MessageInsight>;
  setMessageInsight: (messageId: string, insight: MessageInsight) => void;
  clearInsights: () => void;

  // Streaming
  streamingMessageId: string | null;
  streamingContent: string;
  isGenerating: boolean;
  startStreaming: (messageId: string) => void;
  appendStreamContent: (chunk: string) => void;
  finishStreaming: (finalContent: string) => void;
  cancelStreaming: () => void;

  // UI State
  sidebarOpen: boolean;
  infoPanelOpen: boolean;
  toggleSidebar: () => void;
  toggleInfoPanel: () => void;
  setSidebarOpen: (open: boolean) => void;
  setInfoPanelOpen: (open: boolean) => void;

  // Mode
  mode: 'simulated' | 'ai';
  model: string;
  setMode: (mode: 'simulated' | 'ai') => void;
  setModel: (model: string) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // Conversations
  activeConversationId: null,
  conversations: [],
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setConversations: (conversations) => set({ conversations }),
  addConversation: (conversation) => set((s) => ({
    conversations: [conversation, ...s.conversations],
  })),
  removeConversation: (id) => set((s) => ({
    conversations: s.conversations.filter((c) => c.id !== id),
    activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
    messages: s.activeConversationId === id ? [] : s.messages,
  })),
  updateConversationTitle: (id, title) => set((s) => ({
    conversations: s.conversations.map((c) =>
      c.id === id ? { ...c, title } : c
    ),
  })),

  // Messages
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({
    messages: [...s.messages, message],
  })),
  updateMessage: (id, updates) => set((s) => ({
    messages: s.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
  })),

  // Understanding
  messageInsights: {},
  setMessageInsight: (messageId, insight) => set((s) => ({
    messageInsights: { ...s.messageInsights, [messageId]: insight },
  })),
  clearInsights: () => set({ messageInsights: {} }),

  // Streaming
  streamingMessageId: null,
  streamingContent: '',
  isGenerating: false,
  startStreaming: (messageId) => set({
    streamingMessageId: messageId,
    streamingContent: '',
    isGenerating: true,
  }),
  appendStreamContent: (chunk) => set((s) => ({
    streamingContent: s.streamingContent + chunk,
  })),
  finishStreaming: (finalContent) => {
    const { streamingMessageId } = get();
    set((s) => ({
      streamingMessageId: null,
      streamingContent: '',
      isGenerating: false,
      messages: s.messages.map((m) =>
        m.id === streamingMessageId
          ? { ...m, content: finalContent, status: 'complete' as const }
          : m
      ),
    }));
  },
  cancelStreaming: () => {
    const { streamingMessageId, streamingContent } = get();
    set((s) => ({
      streamingMessageId: null,
      streamingContent: '',
      isGenerating: false,
      messages: s.messages.map((m) =>
        m.id === streamingMessageId
          ? { ...m, content: streamingContent || m.content, status: 'complete' as const }
          : m
      ),
    }));
  },

  // UI State
  sidebarOpen: true,
  infoPanelOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleInfoPanel: () => set((s) => ({ infoPanelOpen: !s.infoPanelOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setInfoPanelOpen: (open) => set({ infoPanelOpen: open }),

  // Mode
  mode: 'simulated',
  model: 'demo',
  setMode: (mode) => set({ mode }),
  setModel: (model) => set({ model }),
}));
