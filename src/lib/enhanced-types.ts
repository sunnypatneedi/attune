// Enhanced types for the Human-Centered AI Framework

// ------ Intention Types ------
export enum IntentionType {
  // Information-seeking intentions
  QUESTION_FACTUAL = 'question_factual',            // Seeking factual information
  QUESTION_OPINION = 'question_opinion',            // Seeking opinions
  QUESTION_CLARIFICATION = 'question_clarification', // Seeking clarification
  
  // Action-oriented intentions
  REQUEST_ACTION = 'request_action',                // Requesting the system to do something
  SUGGEST_ACTION = 'suggest_action',                // Suggesting an action
  COMMAND = 'command',                              // Giving a direct command
  
  // Social intentions
  GREETING = 'greeting',                            // Saying hello
  FAREWELL = 'farewell',                            // Saying goodbye
  GRATITUDE = 'gratitude',                          // Expressing thanks
  APOLOGY = 'apology',                              // Apologizing
  AGREEMENT = 'agreement',                          // Expressing agreement
  DISAGREEMENT = 'disagreement',                    // Expressing disagreement
  
  // Emotional intentions
  EXPRESS_POSITIVE = 'express_positive',            // Expressing positive emotion
  EXPRESS_NEGATIVE = 'express_negative',            // Expressing negative emotion
  EXPRESS_NEUTRAL = 'express_neutral',              // Expressing neutral emotion
  
  // Meta-conversational intentions
  FEEDBACK_POSITIVE = 'feedback_positive',          // Providing positive feedback
  FEEDBACK_NEGATIVE = 'feedback_negative',          // Providing negative feedback
  TOPIC_SWITCH = 'topic_switch',                    // Changing the topic
  META_COMMUNICATION = 'meta_communication',        // Talking about the conversation itself
  
  // System intentions (used by the system, not the user)
  SYSTEM_INFORM = 'system_inform',                  // Providing information
  SYSTEM_REQUEST = 'system_request',                // Requesting information
  SYSTEM_SUGGEST = 'system_suggest',                // Making a suggestion
  SYSTEM_ACKNOWLEDGE = 'system_acknowledge',        // Acknowledging user input
  SYSTEM_CLARIFY = 'system_clarify',                // Seeking clarification
  
  // Fallback
  UNKNOWN = 'unknown'                               // Could not determine intention
}

export interface Intention {
  type: IntentionType;
  confidence: number;                 // 0.0 to 1.0 confidence in this intention
  relatedEntities?: Entity[];         // Entities related to this intention
  parentIntention?: Intention;        // Higher-level intention this is part of
  childIntentions?: Intention[];      // Component intentions of this intention
  metadata?: Record<string, any>;     // Additional intention-specific data
}

// ------ Entity Types ------
export enum EntityType {
  PERSON = 'person',
  LOCATION = 'location',
  ORGANIZATION = 'organization',
  DATE_TIME = 'date_time',
  DURATION = 'duration',
  PRODUCT = 'product',
  EVENT = 'event',
  TOPIC = 'topic',
  CONCEPT = 'concept',
  TASK = 'task',
  PREFERENCE = 'preference',
  CUSTOM = 'custom'
}

export interface Entity {
  id?: string;                        // Unique identifier
  type: EntityType;                   // Type of entity
  value: string;                      // Raw text value
  normalizedValue?: string;           // Normalized/canonical form
  startIndex?: number;                // Start position in original text
  endIndex?: number;                  // End position in original text
  confidence: number;                 // 0.0 to 1.0 confidence in entity detection
  attributes?: Record<string, any>;   // Additional entity attributes
  firstMentionedAt?: number;          // Timestamp of first mention
  lastMentionedAt?: number;           // Timestamp of most recent mention
  mentionCount?: number;              // Number of times mentioned
}

// ------ Enhanced Message Types ------
export interface EnhancedMessage {
  id?: string;                        // Unique identifier
  content: string;                    // Raw message content
  sender: 'user' | 'system';          // Who sent the message
  timestamp: number;                  // When the message was sent
  
  // Enhanced understanding elements
  detectedIntentions?: Intention[];   // Intentions detected in this message
  primaryIntention?: Intention;       // The main intention of this message
  entities?: Entity[];                // Entities mentioned in this message
  sentiment?: {                       // Emotional tone of the message
    positive: number;                 // 0.0 to 1.0 scale
    negative: number;                 // 0.0 to 1.0 scale
    neutral: number;                  // 0.0 to 1.0 scale
  };
  
  // UI-specific fields
  isNew?: boolean;                    // For UI animations
  isEdited?: boolean;                 // If message was edited
  referencedMessages?: string[];      // IDs of messages this one references
}

// ------ Working Memory Types ------
export interface FocusState {
  activeTopics: string[];             // Currently active topics in conversation
  activeEntities: Entity[];           // Currently relevant entities
  recentIntentions: Intention[];      // Recent user intentions
  attentionPriorities: Record<string, number>; // Priority scores for different elements
}

export interface ConversationContext {
  currentFocus: FocusState;           // Current focus of attention
  recentMessages: EnhancedMessage[];  // Recent messages for context
  entityMap: Map<string, Entity>;     // Quick lookup of entities by ID or value
  conversationState: {                // Overall conversation state
    startTime: number;                // When the conversation started
    messageCount: number;             // Total number of messages
    activeTopics: string[];           // Currently active topics
    dominantSentiment?: string;       // Overall sentiment of conversation
    userEngagementLevel?: number;     // Measure of user engagement (0.0 to 1.0)
  };
}

// ------ Interaction Pattern Types ------
export enum PatternType {
  SEQUENTIAL = 'sequential',          // Sequence of interactions
  TEMPORAL = 'temporal',              // Time-based pattern
  FREQUENCY = 'frequency',            // Frequency of certain interactions
  CONTEXTUAL = 'contextual'           // Context-dependent patterns
}

export interface InteractionPattern {
  id?: string;                        // Unique identifier
  type: PatternType;                  // Type of pattern
  description: string;                // Human-readable description
  confidence: number;                 // 0.0 to 1.0 confidence in pattern
  occurrences: number;                // Number of times observed
  firstObservedAt: number;            // When first observed
  lastObservedAt: number;             // When last observed
  elements: any[];                    // Pattern-specific elements 
  metadata?: Record<string, any>;     // Additional pattern data
}

export interface InteractionEvent {
  timestamp: number;                  // When the event occurred
  type: string;                       // Type of interaction
  data: any;                          // Event-specific data
}

// ------ Response Generation Types ------
export interface ResponseContext {
  userMessage: EnhancedMessage;       // The message being responded to
  conversationContext: ConversationContext; // Current conversation context
  detectedPatterns?: InteractionPattern[]; // Relevant interaction patterns
}

export interface ResponseStrategy {
  type: string;                       // Type of response strategy
  priority: number;                   // Priority level (higher = more important)
  applicabilityScore: number;         // How applicable this strategy is (0.0 to 1.0)
  generateResponse: (context: ResponseContext) => string; // Response generator
}
