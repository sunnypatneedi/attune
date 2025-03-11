
import { Pattern } from '@/hooks/use-chat-state';

export const detectIntention = (message: string): string => {
  const intentions = ['Question', 'Request', 'Statement', 'Greeting', 'Command'];
  if (message.endsWith('?')) return 'Question';
  if (message.startsWith('Hi') || message.startsWith('Hello')) return 'Greeting';
  if (message.startsWith('Please') || message.includes('could you')) return 'Request';
  if (message.includes('!')) return 'Command';
  return intentions[Math.floor(Math.random() * intentions.length)];
};

export const extractEntities = (message: string): string[] => {
  const entities = [];
  if (message.includes('tomorrow')) entities.push('tomorrow (Date)');
  if (message.includes('today')) entities.push('today (Date)');
  if (message.includes('weather')) entities.push('weather (Topic)');
  if (message.includes('meeting')) entities.push('meeting (Event)');
  
  const words = message.split(' ');
  for (const word of words) {
    if (word.length > 1 && word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
      if (!['I', 'A', 'The', 'This', 'That', 'They', 'We', 'You', 'It'].includes(word)) {
        entities.push(`${word} (Person)`);
      }
    }
  }
  
  return entities;
};

export const extractTopics = (message: string): string[] => {
  const topics = [];
  if (message.toLowerCase().includes('weather')) topics.push('Weather');
  if (message.toLowerCase().includes('meeting')) topics.push('Meetings');
  if (message.toLowerCase().includes('help')) topics.push('Assistance');
  if (message.toLowerCase().includes('schedule')) topics.push('Calendar');
  return topics;
};

export const updatePatterns = (message: string, patterns: Pattern[]): Pattern[] => {
  const newPatterns = [...patterns];
  
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
  
  return newPatterns.sort((a, b) => b.confidence - a.confidence);
};

export const generateResponse = (message: string, intention: string): string => {
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
