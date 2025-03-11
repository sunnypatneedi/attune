import { 
  Message,
  Context,
  Entity,
  UserIntention,
  ReflectionInsight,
  ContextUnderstandingOutput,
  ConversationState
} from '../../types';
import { EntityTracker } from './entity-tracker';
import { IntentionRecognizer } from './intention-recognizer';

/**
 * ContextualUnderstandingCapacity integrates entity tracking and intention recognition
 * to build and maintain an understanding of the conversation context.
 */
export class ContextualUnderstandingCapacity {
  private entityTracker: EntityTracker;
  private intentionRecognizer: IntentionRecognizer;
  private conversationState: ConversationState;
  
  constructor() {
    this.entityTracker = new EntityTracker();
    this.intentionRecognizer = new IntentionRecognizer();
    this.conversationState = this.initializeConversationState();
  }
  
  /**
   * Process a new message to update the contextual understanding.
   */
  processMessage(message: Message, currentContext: Context): ContextUnderstandingOutput {
    // Update entity tracking
    const entities = this.entityTracker.processMessage(message);
    
    // Update intention recognition
    const updatedContext = {
      ...currentContext,
      entities: [...currentContext.entities, ...entities]
    };
    const intentions = this.intentionRecognizer.recognizeIntentions(message, updatedContext);
    
    // Update conversation state
    this.updateConversationState(message);
    
    return {
      entities,
      intentions,
      conversationState: { ...this.conversationState }
    };
  }
  
  /**
   * Build a comprehensive context for the current conversation state.
   */
  buildContext(): Context {
    return {
      entities: this.entityTracker.getEntitiesForContext(),
      userIntentions: this.intentionRecognizer.getIntentionsForContext(),
      conversationState: { ...this.conversationState },
      recentMessages: this.conversationState.recentMessages
    };
  }
  
  /**
   * Generate a contextual summary for the current conversation.
   */
  generateContextualSummary(): string {
    const entities = this.entityTracker.getSalientEntities();
    const primaryIntention = this.intentionRecognizer.getPrimaryIntention();
    const activeTopics = this.conversationState.activeTopics;
    
    // Build a summary paragraph
    let summary = "Current conversation context: ";
    
    // Add primary intention if available
    if (primaryIntention) {
      summary += `The user's main intention appears to be ${this.describeIntention(primaryIntention)}. `;
    }
    
    // Add key entities
    if (entities.length > 0) {
      summary += "Key entities in the conversation include ";
      summary += entities.map(entity => `${entity.name} (${entity.type})`).join(", ");
      summary += ". ";
    }
    
    // Add active topics
    if (activeTopics.length > 0) {
      summary += "Active topics include ";
      summary += activeTopics.join(", ");
      summary += ". ";
    }
    
    // Add emotional context if available
    if (this.conversationState.recentSentiment !== 0) {
      const sentimentDescription = this.conversationState.recentSentiment > 0 
        ? "positive" 
        : "negative";
      summary += `The conversation tone appears to be ${sentimentDescription}. `;
    }
    
    return summary;
  }
  
  /**
   * Find entities related to a specific keyword or pattern.
   */
  findRelatedEntities(keyword: string): Entity[] {
    const allEntities = this.entityTracker.getAllEntities();
    return allEntities.filter(entity => 
      entity.name.toLowerCase().includes(keyword.toLowerCase()) ||
      Object.values(entity.attributes).some(value => 
        typeof value === 'string' && value.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }
  
  /**
   * Determine if the current context contains a specific concept.
   */
  containsConcept(concept: string): boolean {
    // Check in entities
    const relatedEntities = this.findRelatedEntities(concept);
    if (relatedEntities.length > 0) {
      return true;
    }
    
    // Check in active topics
    if (this.conversationState.activeTopics.some(topic => 
      topic.toLowerCase().includes(concept.toLowerCase())
    )) {
      return true;
    }
    
    // Check in recent messages
    return this.conversationState.recentMessages.some(message => 
      typeof message.content === 'string' && 
      message.content.toLowerCase().includes(concept.toLowerCase())
    );
  }
  
  /**
   * Get entities of a specific type.
   */
  getEntitiesByType(entityType: string): Entity[] {
    return this.entityTracker.getEntitiesByType(entityType);
  }
  
  /**
   * Complete an intention that has been addressed.
   */
  completeIntention(intentionId: string): void {
    this.intentionRecognizer.completeIntention(intentionId);
  }
  
  /**
   * Update the conversation state with a new message.
   */
  private updateConversationState(message: Message): void {
    // Update recent messages
    this.addRecentMessage(message);
    
    // Update sentiment (simplified)
    if (typeof message.content === 'string') {
      this.updateSentiment(message.content);
    }
    
    // Update active topics (simplified)
    if (typeof message.content === 'string') {
      this.extractAndUpdateTopics(message.content);
    }
    
    // Update turn count
    this.conversationState.turnCount++;
    
    // Update timestamp
    this.conversationState.lastUpdateTimestamp = Date.now();
  }
  
  /**
   * Initialize a new conversation state.
   */
  private initializeConversationState(): ConversationState {
    return {
      activeTopics: [],
      recentSentiment: 0,
      recentMessages: [],
      turnCount: 0,
      lastUpdateTimestamp: Date.now()
    };
  }
  
  /**
   * Add a message to the recent messages list.
   */
  private addRecentMessage(message: Message): void {
    // Keep only the last 10 messages
    if (this.conversationState.recentMessages.length >= 10) {
      this.conversationState.recentMessages.shift();
    }
    
    this.conversationState.recentMessages.push(message);
  }
  
  /**
   * Update the sentiment score based on message content.
   */
  private updateSentiment(content: string): void {
    // Simplified sentiment analysis - in a real system this would use NLP
    const positiveWords = ['happy', 'good', 'great', 'excellent', 'wonderful', 'love', 'like', 'thanks', 'thank you'];
    const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'angry', 'upset', 'sorry'];
    
    let sentimentScore = 0;
    
    // Check for positive words
    for (const word of positiveWords) {
      if (content.toLowerCase().includes(word)) {
        sentimentScore += 0.2;
      }
    }
    
    // Check for negative words
    for (const word of negativeWords) {
      if (content.toLowerCase().includes(word)) {
        sentimentScore -= 0.2;
      }
    }
    
    // Blend with previous sentiment (70% new, 30% previous)
    this.conversationState.recentSentiment = 
      (sentimentScore * 0.7) + (this.conversationState.recentSentiment * 0.3);
    
    // Clamp to range [-1, 1]
    this.conversationState.recentSentiment = Math.max(-1, Math.min(1, this.conversationState.recentSentiment));
  }
  
  /**
   * Extract topics from message content and update active topics.
   */
  private extractAndUpdateTopics(content: string): void {
    // Simplified topic extraction - in a real system this would use NLP
    // This approach looks for noun phrases that might represent topics
    
    // For this demo, we'll extract capitalized phrases and common nouns
    const words = content.split(/\s+/);
    const potentialTopics: string[] = [];
    
    // Collect capitalized words (potential proper nouns)
    for (const word of words) {
      const cleanWord = word.replace(/[^\w\s]/g, '');
      if (cleanWord.length > 0 && cleanWord[0] === cleanWord[0].toUpperCase()) {
        potentialTopics.push(cleanWord);
      }
    }
    
    // Look for common topic indicators
    const topicIndicators = [
      'about', 'regarding', 'concerning', 'discussing', 
      'talk about', 'learn about', 'interested in'
    ];
    
    for (const indicator of topicIndicators) {
      const index = content.toLowerCase().indexOf(indicator);
      if (index !== -1) {
        // Extract the next few words after the indicator
        const afterIndicator = content.substring(index + indicator.length).trim();
        const nextPhrase = afterIndicator.split(/[.,:;?!]|\n/)[0].trim();
        if (nextPhrase.length > 0) {
          potentialTopics.push(nextPhrase);
        }
      }
    }
    
    // Update active topics
    for (const topic of potentialTopics) {
      if (!this.conversationState.activeTopics.includes(topic)) {
        this.conversationState.activeTopics.push(topic);
      }
    }
    
    // Limit to most recent 5 topics
    if (this.conversationState.activeTopics.length > 5) {
      this.conversationState.activeTopics = this.conversationState.activeTopics.slice(
        this.conversationState.activeTopics.length - 5
      );
    }
  }
  
  /**
   * Describe an intention in natural language.
   */
  private describeIntention(intention: UserIntention): string {
    switch (intention.type) {
      case 'information_request':
        return 'seeking information';
      case 'task_request':
        return 'requesting that a task be performed';
      case 'problem_solving':
        return 'solving a problem';
      case 'opinion_request':
        return 'seeking an opinion';
      case 'emotional_support':
        return 'seeking emotional support';
      case 'clarification':
        return 'asking for clarification';
      case 'small_talk':
        return 'engaging in casual conversation';
      case 'preference_expression':
        return 'expressing preferences';
      case 'decision_making':
        return 'making a decision';
      case 'general_communication':
        return 'general communication';
      default:
        return `a ${intention.type}`;
    }
  }
  
  /**
   * Load entities and intentions from a context.
   */
  loadFromContext(context: Context): void {
    this.entityTracker.loadFromContext(context);
    this.intentionRecognizer.loadFromContext(context);
    
    if (context.conversationState) {
      this.conversationState = { ...context.conversationState };
    }
  }
  
  /**
   * Evolve the capacity based on insights from reflection.
   */
  evolve(insight: ReflectionInsight): void {
    if (insight.targetCapacity !== 'contextualUnderstanding') {
      return;
    }
    
    // Apply insights to improve contextual understanding
    if (insight.insightType === 'improvement') {
      console.log(`Applying improvement insight to contextual understanding: ${insight.description}`);
      
      // For demonstration - in a real system this would modify behavior parameters
      if (insight.description.includes('entity recognition')) {
        // Implement entity recognition improvements
      } else if (insight.description.includes('intention recognition')) {
        // Implement intention recognition improvements
      } else if (insight.description.includes('topic tracking')) {
        // Implement topic tracking improvements
      }
    }
  }
  
  /**
   * Reset the contextual understanding for a new conversation.
   */
  reset(): void {
    this.entityTracker.reset();
    this.intentionRecognizer.reset();
    this.conversationState = this.initializeConversationState();
  }
}
