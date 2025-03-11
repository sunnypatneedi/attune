
import { useState } from 'react';

export type Message = {
  id: string;
  content: string;
  isUser: boolean;
  intention?: string;
  entities?: Array<{ name: string; type: string }>;
  timestamp: string;
};

export type Pattern = {
  name: string;
  confidence: number;
};

export type WorkingMemory = {
  activeTopics: string[];
  recentEntities: string[];
  turns: number;
};

export const useChatState = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Welcome to the Adaptive Chat Demo! Try sending messages with different intentions and entities.',
      isUser: false,
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);
  
  const [workingMemory, setWorkingMemory] = useState<WorkingMemory>({
    activeTopics: ['Demo'],
    recentEntities: [],
    turns: 1,
  });
  
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  return {
    messages,
    setMessages,
    workingMemory,
    setWorkingMemory,
    patterns,
    setPatterns,
    isProcessing,
    setIsProcessing,
  };
};
