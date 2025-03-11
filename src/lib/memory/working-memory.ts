import { 
  ConversationContext, 
  Entity, 
  EnhancedMessage, 
  FocusState, 
  Intention,
  EntityType
} from '../enhanced-types';

/**
 * WorkingMemory maintains the current conversation context
 * and manages attention focus during interactions.
 */
export class WorkingMemory {
  private context: ConversationContext;
  private maxRecentMessages: number = 10;
  private entityExpirationTime: number = 30 * 60 * 1000; // 30 minutes
  
  constructor() {
    // Initialize empty context
    this.context = {
      currentFocus: {
        activeTopics: [],
        activeEntities: [],
        recentIntentions: [],
        attentionPriorities: {}
      },
      recentMessages: [],
      entityMap: new Map<string, Entity>(),
      conversationState: {
        startTime: Date.now(),
        messageCount: 0,
        activeTopics: [],
        userEngagementLevel: 0.5 // Default mid-level engagement
      }
    };
  }
  
  /**
   * Get the current conversation context
   * @returns The current context
   */
  getContext(): ConversationContext {
    return this.context;
  }
  
  /**
   * Update the working memory with a new message
   * @param message The message to add to context
   */
  addMessage(message: EnhancedMessage): void {
    // Add to recent messages, maintaining size limit
    this.context.recentMessages.push(message);
    if (this.context.recentMessages.length > this.maxRecentMessages) {
      this.context.recentMessages.shift();
    }
    
    // Update message count
    this.context.conversationState.messageCount++;
    
    // Update entities in memory
    if (message.entities && message.entities.length > 0) {
      this.updateEntities(message.entities);
    }
    
    // Update intentions in memory
    if (message.detectedIntentions && message.detectedIntentions.length > 0) {
      this.updateIntentions(message.detectedIntentions);
    }
    
    // Update topics
    this.updateTopics(message);
    
    // Update user engagement level (if user message)
    if (message.sender === 'user') {
      this.updateEngagementLevel(message);
    }
    
    // Refresh focus state
    this.refreshFocusState();
  }
  
  /**
   * Update entities in the working memory
   * @param entities Entities to add or update
   */
  private updateEntities(entities: Entity[]): void {
    const now = Date.now();
    
    for (const entity of entities) {
      const normalizedValue = entity.normalizedValue || entity.value.toLowerCase();
      const entityKey = `${entity.type}:${normalizedValue}`;
      
      if (this.context.entityMap.has(entityKey)) {
        // Update existing entity
        const existingEntity = this.context.entityMap.get(entityKey)!;
        
        const updatedEntity: Entity = {
          ...existingEntity,
          lastMentionedAt: now,
          mentionCount: (existingEntity.mentionCount || 1) + 1,
          // Keep the higher confidence
          confidence: Math.max(existingEntity.confidence, entity.confidence),
          // Merge attributes if they exist
          attributes: { 
            ...(existingEntity.attributes || {}), 
            ...(entity.attributes || {}) 
          }
        };
        
        this.context.entityMap.set(entityKey, updatedEntity);
      } else {
        // Add new entity with tracking info
        const newEntity: Entity = {
          ...entity,
          firstMentionedAt: now,
          lastMentionedAt: now,
          mentionCount: 1,
          normalizedValue: normalizedValue
        };
        
        this.context.entityMap.set(entityKey, newEntity);
      }
    }
    
    // Clean up expired entities
    this.cleanupExpiredEntities();
  }
  
  /**
   * Remove entities that haven't been mentioned recently
   */
  private cleanupExpiredEntities(): void {
    const now = Date.now();
    
    for (const [key, entity] of this.context.entityMap.entries()) {
      if (now - (entity.lastMentionedAt || 0) > this.entityExpirationTime) {
        this.context.entityMap.delete(key);
      }
    }
  }
  
  /**
   * Update intentions in working memory
   * @param intentions New intentions to track
   */
  private updateIntentions(intentions: Intention[]): void {
    // Keep only the most recent intentions (limit to 5)
    this.context.currentFocus.recentIntentions = [
      ...intentions.slice(0, 2), // Add 2 most confident intentions from current message
      ...this.context.currentFocus.recentIntentions // Add previous intentions
    ].slice(0, 5); // Keep only 5 most recent
  }
  
  /**
   * Update topics based on message content
   * @param message The message to analyze for topics
   */
  private updateTopics(message: EnhancedMessage): void {
    // Extract topics from entities
    const topicEntities = message.entities?.filter(e => 
      e.type === EntityType.TOPIC || e.type === EntityType.CONCEPT
    ) || [];
    
    // Add extracted topics to active topics
    for (const topicEntity of topicEntities) {
      if (!this.context.conversationState.activeTopics.includes(topicEntity.value)) {
        this.context.conversationState.activeTopics.push(topicEntity.value);
      }
    }
    
    // Limit to 5 most recent topics
    if (this.context.conversationState.activeTopics.length > 5) {
      this.context.conversationState.activeTopics = 
        this.context.conversationState.activeTopics.slice(-5);
    }
  }
  
  /**
   * Update user engagement level based on message
   * @param message User message to analyze
   */
  private updateEngagementLevel(message: EnhancedMessage): void {
    // Simple engagement heuristics
    let adjustment = 0;
    
    // Longer messages suggest higher engagement
    if (message.content.length > 100) adjustment += 0.1;
    else if (message.content.length > 50) adjustment += 0.05;
    else if (message.content.length < 10) adjustment -= 0.05;
    
    // Questions suggest engagement
    if (message.content.includes('?')) adjustment += 0.05;
    
    // Commands/requests suggest engagement
    if (message.primaryIntention?.type === 'command' || 
        message.primaryIntention?.type === 'request_action') {
      adjustment += 0.1;
    }
    
    // Apply adjustment with bounds
    this.context.conversationState.userEngagementLevel = 
      Math.max(0, Math.min(1, (this.context.conversationState.userEngagementLevel || 0.5) + adjustment));
  }
  
  /**
   * Refresh the focus state based on current context
   */
  private refreshFocusState(): void {
    const focus: FocusState = {
      activeTopics: [...this.context.conversationState.activeTopics],
      activeEntities: this.getActiveEntities(),
      recentIntentions: [...this.context.currentFocus.recentIntentions],
      attentionPriorities: this.calculateAttentionPriorities()
    };
    
    this.context.currentFocus = focus;
  }
  
  /**
   * Get the most active entities for the focus state
   * @returns Array of most active entities
   */
  private getActiveEntities(): Entity[] {
    const now = Date.now();
    const entities = Array.from(this.context.entityMap.values());
    
    // Sort by recency and frequency
    return entities
      .sort((a, b) => {
        // Score based on recency and mention count
        const scoreA = ((a.mentionCount || 1) * 10000) - (now - (a.lastMentionedAt || 0));
        const scoreB = ((b.mentionCount || 1) * 10000) - (now - (b.lastMentionedAt || 0));
        return scoreB - scoreA;
      })
      .slice(0, 10); // Limit to 10 most active entities
  }
  
  /**
   * Calculate attention priorities for different elements
   * @returns Map of attention priorities
   */
  private calculateAttentionPriorities(): Record<string, number> {
    const priorities: Record<string, number> = {};
    
    // Prioritize recent entities
    const activeEntities = this.getActiveEntities();
    for (let i = 0; i < activeEntities.length; i++) {
      const entity = activeEntities[i];
      const priority = 1 - (i / activeEntities.length); // 1.0 to 0.0
      priorities[`entity:${entity.type}:${entity.normalizedValue || entity.value}`] = priority;
    }
    
    // Prioritize recent intentions
    const recentIntentions = this.context.currentFocus.recentIntentions;
    for (let i = 0; i < recentIntentions.length; i++) {
      const intention = recentIntentions[i];
      const priority = 1 - (i / recentIntentions.length); // 1.0 to 0.0
      priorities[`intention:${intention.type}`] = priority;
    }
    
    // Prioritize active topics
    const activeTopics = this.context.conversationState.activeTopics;
    for (let i = 0; i < activeTopics.length; i++) {
      const topic = activeTopics[i];
      const priority = 1 - (i / activeTopics.length); // 1.0 to 0.0
      priorities[`topic:${topic}`] = priority;
    }
    
    return priorities;
  }
  
  /**
   * Explicitly set focus on a specific entity
   * @param entity Entity to focus on
   */
  focusOnEntity(entity: Entity): void {
    // Update the entity's last mentioned timestamp
    const normalizedValue = entity.normalizedValue || entity.value.toLowerCase();
    const entityKey = `${entity.type}:${normalizedValue}`;
    
    if (this.context.entityMap.has(entityKey)) {
      const existingEntity = this.context.entityMap.get(entityKey)!;
      existingEntity.lastMentionedAt = Date.now();
      this.context.entityMap.set(entityKey, existingEntity);
    } else {
      // Add it if it doesn't exist
      const newEntity: Entity = {
        ...entity,
        firstMentionedAt: Date.now(),
        lastMentionedAt: Date.now(),
        mentionCount: 1,
        normalizedValue: normalizedValue
      };
      this.context.entityMap.set(entityKey, newEntity);
    }
    
    // Refresh focus state
    this.refreshFocusState();
  }
  
  /**
   * Explicitly set focus on a specific topic
   * @param topic Topic to focus on
   */
  focusOnTopic(topic: string): void {
    // Remove the topic if it already exists (to put it at the end/most recent)
    this.context.conversationState.activeTopics = 
      this.context.conversationState.activeTopics.filter(t => t !== topic);
    
    // Add it to the end (most recent)
    this.context.conversationState.activeTopics.push(topic);
    
    // Refresh focus state
    this.refreshFocusState();
  }
  
  /**
   * Reset the working memory
   */
  reset(): void {
    this.context = {
      currentFocus: {
        activeTopics: [],
        activeEntities: [],
        recentIntentions: [],
        attentionPriorities: {}
      },
      recentMessages: [],
      entityMap: new Map<string, Entity>(),
      conversationState: {
        startTime: Date.now(),
        messageCount: 0,
        activeTopics: [],
        userEngagementLevel: 0.5 // Default mid-level engagement
      }
    };
  }
}
