/**
 * Core type definitions for the Human-Centered AI Application Framework
 */

// ====== Common Types ======

export interface Entity {
  id: string;
  type: string;
  name: string;
  attributes: Record<string, any>;
  firstSeen: number;
  lastSeen: number;
}

export interface EntityReference {
  entityId: string;
  mentionText: string;
  timestamp: number;
  messageId: string;
}

export interface EntityInfo {
  attributes: Record<string, any>;
  confidence: number;
  source: string;
}

export interface UserIntention {
  id: string;
  type: string;
  confidence: number;
  timestamp: number;
  messageId: string;
  relatedEntities: string[];
}

export interface IntentionChange {
  previousIntention: UserIntention;
  currentIntention: UserIntention;
  changeConfidence: number;
  transitionType: 'refinement' | 'shift' | 'abandonment' | 'return';
}

export interface ConversationState {
  id: string;
  stage: 'greeting' | 'exploration' | 'focused' | 'resolution' | 'farewell';
  activeTopics: string[];
  recentSentiment: number; // -1.0 to 1.0
  engagementLevel: number; // 0.0 to 1.0
  userSatisfaction: number; // 0.0 to 1.0
}

export interface EnvironmentalFactor {
  type: string;
  value: any;
  confidence: number;
  timestamp: number;
}

export interface UserPreference {
  id: string;
  category: string;
  value: any;
  confidence: number;
  lastUpdated: number;
  source: 'explicit' | 'implicit' | 'default';
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'assistant' | 'system';
  content: string | Record<string, any>;
  timestamp: number;
  metadata: Record<string, any>;
}

export interface Conversation {
  id: string;
  startTime: number;
  endTime: number | null;
  participants: string[];
  metadata: Record<string, any>;
}

export interface Interaction {
  id: string;
  messageId: string; 
  interactionType: string;
  contextData: Record<string, any>;
  timestamp: number;
}

export interface Context {
  entities: Entity[];
  userIntentions: UserIntention[];
  conversationState: ConversationState;
  environmentalFactors: EnvironmentalFactor[];
  userPreferences: UserPreference[];
  recentMessages: Message[];
  conversationId: string;
}

// ====== Presence Capacity Types ======

export interface FocusTarget {
  type: 'entity' | 'intention' | 'topic' | 'message';
  id: string;
  priority: number;
}

export interface AttentionFocus {
  primaryFocus: string;
  secondaryFoci: string[];
  distractionLevel: number;
}

export interface FocusParameters {
  attentionThreshold: number;
  decayRate: number;
  maxSecondaryFoci: number;
}

export interface RelevantContext {
  entities: Entity[];
  intentions: UserIntention[];
  messages: Message[];
  contextualFactors: EnvironmentalFactor[];
}

export interface PresenceOutput {
  focus: AttentionFocus;
  relevantContext: RelevantContext;
}

// ====== Value Grounding Capacity Types ======

export interface CoreValue {
  id: string;
  description: string;
  importance: number;
  manifestations: ValueManifestation[];
}

export interface ValueManifestation {
  context: string;
  behavior: string;
}

export interface ValueTension {
  valueId1: string;
  valueId2: string;
  tensionType: 'priority' | 'interpretation' | 'application';
  contextElements: string[];
  resolutionStrategy?: string;
}

export interface ApplicabilityEnhancement {
  valueId: string;
  contextPattern: Record<string, any>;
  applicabilityModifier: number; // 0.0 to 2.0 where 1.0 is neutral
}

export interface ValueOutput {
  relevantValues: CoreValue[];
  valueTensions: ValueTension[];
  valueConstraints: Record<string, any>;
}

// ====== Contextual Understanding Capacity Types ======

export interface ContextualUnderstanding {
  entities: Entity[];
  userIntentions: UserIntention[];
  conversationState: ConversationState;
  environmentalFactors: EnvironmentalFactor[];
  userPreferences: UserPreference[];
}

// ====== Expression Capacity Types ======

export interface ResponseCandidate {
  id: string;
  content: string | Record<string, any>;
  appropriatenessScore: number;
  generationStrategy: string;
  intendedOutcome: string;
  values: string[];
}

export interface RefinedResponse {
  content: string | Record<string, any>;
  metadata: Record<string, any>;
  presentationStyle: Record<string, any>;
}

export interface ResponseTone {
  formality: number; // 0.0 to 1.0
  warmth: number; // 0.0 to 1.0
  enthusiasm: number; // 0.0 to 1.0
  directness: number; // 0.0 to 1.0
  customAttributes: Record<string, number>;
}

export interface StyledResponse {
  content: string | Record<string, any>;
  tone: ResponseTone;
  style: Record<string, any>;
}

export interface EngagementResponse {
  response: StyledResponse;
  intendedFocus: FocusTarget[];
  valueBasis: string[];
  trackingData: Record<string, any>;
}

export interface UserFeedback {
  messageId: string;
  feedback: 'positive' | 'negative' | 'neutral';
  details?: string;
  timestamp: number;
}

// ====== Growth Capacity Types ======

export interface InteractionPattern {
  id: string;
  name: string;
  patternElements: Record<string, any>[];
  recognitionCriteria: Record<string, any>;
  observedInstances: number;
  successRate: number;
}

export interface InteractionOutcome {
  interactionId: string;
  metrics: Record<string, number>;
  userFeedback?: UserFeedback;
  success: boolean;
}

export interface PatternEvaluation {
  patternId: string;
  effectivenessScore: number;
  confidenceInterval: [number, number];
  recommendedAdjustments: Record<string, any>;
}

export interface InteractionReflection {
  interactionId: string;
  strengths: string[];
  weaknesses: string[];
  missedOpportunities: string[];
  insightScore: number;
}

export interface ReflectionInsight {
  id: string;
  targetCapacity: 'presence' | 'valueGrounding' | 'contextualUnderstanding' | 'expression' | 'growth' | 'integration';
  insightType: 'pattern' | 'improvement' | 'warning' | 'discovery';
  description: string;
  confidence: number;
  suggestedAction?: Record<string, any>;
}

export interface LearningMoment {
  timestamp: number;
  interactionId: string;
  understanding: ContextualUnderstanding;
  response: EngagementResponse;
  reflection: InteractionReflection;
}

// ====== Integration Layer Types ======

export interface ConflictingOutput {
  outputType: string;
  outputs: Record<string, any>[];
  conflictDescription: string;
}

export interface ResolvedOutput {
  output: Record<string, any>;
  resolutionStrategy: string;
  confidenceScore: number;
}

export interface IntegratedResponse {
  response: EngagementResponse;
  integrationMetrics: Record<string, number>;
}

// ====== State Management Types ======

export interface Change {
  changeType: ChangeType;
  payload: any;
  timestamp: number;
  source: string;
}

export type ChangeType = 
  | 'MESSAGE_ADDED'
  | 'MESSAGE_UPDATED'
  | 'CONVERSATION_STARTED'
  | 'CONVERSATION_ENDED'
  | 'PREFERENCE_UPDATED'
  | 'ENTITY_UPDATED'
  | 'STATE_SNAPSHOT';

export interface ResolvedState {
  state: AppState;
  conflictResolutions: Record<string, string>;
}

export interface AppState {
  conversations: Record<string, Conversation>;
  messages: Record<string, Message[]>;
  entities: Record<string, Entity>;
  preferences: Record<string, UserPreference>;
  activeConversationId?: string;
}

export interface Subscription {
  unsubscribe: () => void;
}

export type EventHandler = (payload: any) => void;

export interface EventStream {
  subscribe: (handler: EventHandler) => Subscription;
}

export interface EventOperator {
  apply: (stream: EventStream) => EventStream;
}

// ====== UI Component Types ======

export interface ComponentAdaptation {
  componentId: string;
  adaptationType: 'layout' | 'style' | 'behavior' | 'content';
  adaptationDetails: Record<string, any>;
  reason: string;
}

export interface SystemFeedback {
  feedbackType: 'info' | 'error' | 'warning' | 'success';
  message: string;
  duration: number;
  actionable: boolean;
  actionText?: string;
  onAction?: () => void;
}
