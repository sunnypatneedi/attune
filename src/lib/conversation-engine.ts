import { BotMessageEvent, dispatchBotMessage, dispatchTyping, eventBus } from './event-bus';
import { Message, addMessage, getMessages } from './database';
import { Database } from 'sql.js';
import { EnhancedUnderstandingFramework } from './enhanced-understanding-framework';
import { EnhancedMessage, ResponseContext, IntentionType } from './enhanced-types';

// Enhanced response generator that uses understanding context
const generateResponse = (context: ResponseContext): string => {
  const { userMessage, conversationContext, detectedPatterns } = context;
  const message = userMessage.content;
  const lowerMessage = message.toLowerCase();
  const intention = userMessage.primaryIntention?.type;
  const entities = userMessage.entities || [];
  
  // Use intention detection for more targeted responses
  switch (intention) {
    case IntentionType.GREETING:
      // Personalize greeting if we know the user
      const personEntity = entities.find(e => e.type === 'person');
      if (personEntity) {
        return `Hello ${personEntity.value}! How can I help you today?`;
      }
      return "Hello there! How can I help you today?";
      
    case IntentionType.QUESTION_FACTUAL:
      // Handle factual questions
      if (lowerMessage.includes('your name')) {
        return "I'm an adaptive conversational UI with enhanced understanding capabilities. You can call me ACI.";
      }
      if (lowerMessage.includes('what can you do') || lowerMessage.includes('help')) {
        return "I can understand your intentions, recognize entities in your messages, maintain context through my working memory, and adapt to your interaction patterns over time.";
      }
      
      // Generic question response with context awareness
      const topics = conversationContext.currentFocus.activeTopics;
      if (topics.length > 0) {
        return `That's an interesting question about ${topics[0]}. I'm a demo with enhanced understanding, but I could be connected to more powerful AI systems to provide better answers in the future.`;
      }
      
      return "That's an interesting question. I now have enhanced understanding capabilities to better serve you.";
      
    case IntentionType.QUESTION_OPINION:
      return "I appreciate you asking for my perspective. While I don't have personal opinions, I can analyze information and provide balanced viewpoints.";
      
    case IntentionType.QUESTION_CLARIFICATION:
      return "I'm happy to clarify. What specifically would you like me to explain better?";
    
    case IntentionType.REQUEST_ACTION:
      // For requests, acknowledge the action requested
      if (lowerMessage.includes('change theme') || 
          lowerMessage.includes('switch theme') || 
          lowerMessage.includes('dark mode') || 
          lowerMessage.includes('light mode')) {
        // The actual theme change is handled by event listeners elsewhere
        return "I've toggled the theme for you. Is this better?";
      }
      
      return "I understand you'd like me to help with something. I'll do my best to assist you.";
    
    case IntentionType.COMMAND:
      return "I'll process that command for you right away.";
    
    case IntentionType.GRATITUDE:
      // Make the response more personal if we have user history
      if (conversationContext.conversationState.messageCount > 5) {
        return "You're very welcome! I'm enjoying our conversation and am here to help with anything else you need.";
      }
      return "You're welcome! Is there anything else I can help with?";
    
    case IntentionType.FAREWELL:
      return "Goodbye! It was nice chatting with you. Feel free to return anytime.";
      
    case IntentionType.AGREEMENT:
      return "I'm glad we're on the same page!";
      
    case IntentionType.DISAGREEMENT:
      return "I understand your perspective. It's valuable to consider different viewpoints.";
      
    case IntentionType.FEEDBACK_POSITIVE:
      return "Thank you for the positive feedback! I'm continuously learning to better assist you.";
      
    case IntentionType.FEEDBACK_NEGATIVE:
      return "I appreciate your feedback. I'll work to improve my responses in the future.";
      
    case IntentionType.EXPRESS_POSITIVE:
      return "I'm glad to hear that! Positive emotions are wonderful to experience.";
      
    case IntentionType.EXPRESS_NEGATIVE:
      return "I'm sorry to hear that. Is there anything I can do to help improve the situation?";
      
    default:
      // Default responses considering context and patterns
      const defaultResponses = [
        "I see. Tell me more about that.",
        "Interesting. How does that make you feel?",
        "I understand. Please continue.",
        "That's noteworthy. What else would you like to discuss?",
        "I'm here to chat with you. What's on your mind?",
        "I'm learning from our conversation. Please tell me more."
      ];
      
      // Use patterns to customize response if available
      if (detectedPatterns && detectedPatterns.length > 0) {
        const topPattern = detectedPatterns[0];
        if (topPattern.type === 'sequential') {
          return `I've noticed a pattern in our conversation. ${defaultResponses[Math.floor(Math.random() * defaultResponses.length)]}`;
        }
      }
      
      return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }
};

// Simulate thinking delay
const getThinkingDelay = (message: string): number => {
  // Longer messages should have longer thinking times
  const baseDelay = 500; // minimum 500ms
  const perCharDelay = 5; // additional 5ms per character
  return Math.min(baseDelay + message.length * perCharDelay, 3000); // max 3 seconds
};

// Initialize the conversation engine with enhanced understanding
export const initConversationEngine = (db: Database) => {
  // Initialize the enhanced understanding framework
  const understandingFramework = new EnhancedUnderstandingFramework();
  
  // Subscribe to user messages
  const subscription = eventBus.subscribe(event => {
    if (event.type === 'userMessage' && event.payload?.text) {
      const userMessage = event.payload.text;
      
      // Store user message in database
      const timestamp = event.payload.timestamp || Date.now();
      addMessage(db, {
        sender: 'user',
        content: userMessage,
        timestamp
      });
      
      // Process through enhanced understanding framework
      const enhancedMessage = understandingFramework.processUserMessage(userMessage);
      
      // Start typing animation
      dispatchTyping(true, 'bot');
      
      // Generate response after a delay
      const thinkingTime = getThinkingDelay(userMessage);
      
      setTimeout(() => {
        // Stop typing animation
        dispatchTyping(false, 'bot');
        
        // Create response context
        const responseContext = understandingFramework.createResponseContext(enhancedMessage);
        
        // Generate enhanced response
        const botResponse = generateResponse(responseContext);
        
        // Process system message through understanding framework
        const enhancedBotMessage = understandingFramework.processSystemMessage(botResponse);
        
        // Dispatch bot message
        const botEvent = dispatchBotMessage(botResponse);
        
        // Store bot message in database
        addMessage(db, {
          sender: 'bot',
          content: botResponse,
          timestamp: botEvent.payload.timestamp || Date.now()
        });
      }, thinkingTime);
    }
  });
  
  return {
    shutdown: () => subscription.unsubscribe()
  };
};

// Synchronize messages across tabs using BroadcastChannel
export const initCrossBrowserSync = (db: Database) => {
  if (typeof window === 'undefined') return { shutdown: () => {} };
  
  try {
    const channel = new BroadcastChannel('adaptive_chat_ui');
    
    // Listen for messages from other tabs
    channel.onmessage = (event) => {
      const data = event.data;
      if (!data || !data.type) return;
      
      // Forwarding events to our local event bus
      // But don't re-broadcast events we received from the channel
      if (data.fromBroadcast) return;
      
      eventBus.next(data);
    };
    
    // Subscribe to our local event bus to broadcast events to other tabs
    const subscription = eventBus.subscribe(event => {
      if (event.type === 'userMessage' || event.type === 'botMessage') {
        // Only broadcast message events
        channel.postMessage({
          ...event,
          fromBroadcast: true // Mark as coming from broadcast to prevent loops
        });
      }
    });
    
    return {
      shutdown: () => {
        subscription.unsubscribe();
        channel.close();
      }
    };
  } catch (e) {
    console.error('BroadcastChannel not supported, falling back to localStorage sync only', e);
    
    // Fallback to localStorage for older browsers
    const storageListener = (e: StorageEvent) => {
      if (e.key === 'lastMessage' && e.newValue) {
        try {
          const msg = JSON.parse(e.newValue);
          if (msg.type === 'userMessage' || msg.type === 'botMessage') {
            eventBus.next(msg);
          }
        } catch (err) {
          console.error('Error parsing message from localStorage', err);
        }
      }
    };
    
    window.addEventListener('storage', storageListener);
    
    const subscription = eventBus.subscribe(event => {
      if (event.type === 'userMessage' || event.type === 'botMessage') {
        localStorage.setItem('lastMessage', JSON.stringify(event));
      }
    });
    
    return {
      shutdown: () => {
        subscription.unsubscribe();
        window.removeEventListener('storage', storageListener);
      }
    };
  }
};
