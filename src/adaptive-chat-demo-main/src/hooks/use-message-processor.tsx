
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

export function useMessageProcessor() {
  const [workingMemory, setWorkingMemory] = useState<WorkingMemory>({
    activeTopics: ['Demo'],
    recentEntities: [],
    turns: 1,
  });
  
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  
  const processMessage = (content: string) => {
    // Extract entities and topics
    const newEntities = extractEntities(content);
    const newTopics = extractTopics(content);
    
    // Update working memory
    setWorkingMemory(prev => ({
      activeTopics: [...new Set([...prev.activeTopics, ...newTopics])],
      recentEntities: [...newEntities, ...prev.recentEntities].slice(0, 5),
      turns: prev.turns + 1,
    }));
    
    // Update patterns
    updatePatterns(content);
    
    // Detect intention
    const intention = detectIntention(content);
    
    // Create system response
    const systemResponse: Omit<Message, 'id' | 'timestamp'> = {
      content: generateResponse(content, intention),
      isUser: false,
      intention,
      entities: newEntities.map(e => {
        const [name, type] = e.split(' (');
        return { name, type: type.replace(')', '') };
      }),
    };
    
    return {
      userIntention: intention,
      systemResponse,
    };
  };
  
  // Simulation functions
  const detectIntention = (message: string): string => {
    const intentions = ['Question', 'Request', 'Statement', 'Greeting', 'Command'];
    // Simple heuristics for demo
    if (message.endsWith('?')) return 'Question';
    if (message.startsWith('Hi') || message.startsWith('Hello')) return 'Greeting';
    if (message.startsWith('Please') || message.includes('could you')) return 'Request';
    if (message.includes('!')) return 'Command';
    return intentions[Math.floor(Math.random() * intentions.length)];
  };

  const extractEntities = (message: string): string[] => {
    const entities = [];
    // Simple entity extraction for demo
    if (message.includes('tomorrow')) entities.push('tomorrow (Date)');
    if (message.includes('today')) entities.push('today (Date)');
    if (message.includes('weather')) entities.push('weather (Topic)');
    if (message.includes('meeting')) entities.push('meeting (Event)');
    
    // Extract potential person names (capitalized words)
    const words = message.split(' ');
    for (const word of words) {
      if (word.length > 1 && word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
        // Skip common sentence starters
        if (!['I', 'A', 'The', 'This', 'That', 'They', 'We', 'You', 'It'].includes(word)) {
          entities.push(`${word} (Person)`);
        }
      }
    }
    
    return entities;
  };

  const extractTopics = (message: string): string[] => {
    const topics = [];
    // Simple topic extraction for demo
    if (message.toLowerCase().includes('weather')) topics.push('Weather');
    if (message.toLowerCase().includes('meeting')) topics.push('Meetings');
    if (message.toLowerCase().includes('help')) topics.push('Assistance');
    if (message.toLowerCase().includes('schedule')) topics.push('Calendar');
    return topics;
  };

  const updatePatterns = (message: string) => {
    // Update existing patterns or create new ones based on message content
    const newPatterns: Pattern[] = [...patterns];
    
    // Example pattern detection logic
    if (message.endsWith('?')) {
      const questionPattern = newPatterns.find(p => p.name === 'Frequent Questions');
      if (questionPattern) {
        questionPattern.confidence = Math.min(100, questionPattern.confidence + 15);
      } else {
        newPatterns.push({ name: 'Frequent Questions', confidence: 30 });
      }
    }
    
    if (message.includes('help') || message.includes('assist')) {
      const helpPattern = newPatterns.find(p => p.name === 'Assistance Requests');
      if (helpPattern) {
        helpPattern.confidence = Math.min(100, helpPattern.confidence + 20);
      } else {
        newPatterns.push({ name: 'Assistance Requests', confidence: 40 });
      }
    }
    
    if (message.includes('meeting') || message.includes('schedule') || message.includes('calendar')) {
      const schedulingPattern = newPatterns.find(p => p.name === 'Scheduling Behavior');
      if (schedulingPattern) {
        schedulingPattern.confidence = Math.min(100, schedulingPattern.confidence + 25);
      } else {
        newPatterns.push({ name: 'Scheduling Behavior', confidence: 45 });
      }
    }
    
    // Sort by confidence
    newPatterns.sort((a, b) => b.confidence - a.confidence);
    setPatterns(newPatterns);
  };

  const generateResponse = (message: string, intention: string): string => {
    // Simple response generation for demo
    if (intention === 'Question') {
      return message.includes('weather') 
        ? "Based on the forecast, tomorrow will be sunny with a high of 75°F."
        : "That's an interesting question. I'll do my best to help you find the answer.";
    }
    
    if (intention === 'Greeting') {
      return "Hello there! How can I assist you today?";
    }
    
    if (intention === 'Request') {
      return "I'll help you with that request right away.";
    }
    
    if (intention === 'Command') {
      return "I've processed your instruction and will take care of it.";
    }
    
    return "I understand what you're saying. Is there anything specific you'd like me to help with?";
  };

  return {
    workingMemory,
    patterns,
    processMessage,
  };
}
