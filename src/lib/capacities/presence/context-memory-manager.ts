import { 
  Interaction, 
  RelevantContext,
  Entity,
  UserIntention,
  Message,
  EnvironmentalFactor,
  Context
} from '../../types';

/**
 * ContextMemoryManager maintains awareness of the conversation context
 * across multiple interactions, providing relevant contextual information
 * when needed.
 */
export class ContextMemoryManager {
  private recentInteractions: Interaction[] = [];
  private entities: Map<string, Entity> = new Map();
  private intentions: Map<string, UserIntention> = new Map();
  private messages: Map<string, Message> = new Map();
  private environmentalFactors: Map<string, EnvironmentalFactor> = new Map();
  
  private maxInteractionsInMemory = 20;
  private maxEntitiesInMemory = 50;
  
  /**
   * Register a new interaction in the context memory.
   */
  registerInteraction(interaction: Interaction, context: Context): void {
    // Add to recent interactions, maintaining the max size
    this.recentInteractions.unshift(interaction);
    if (this.recentInteractions.length > this.maxInteractionsInMemory) {
      this.recentInteractions = this.recentInteractions.slice(0, this.maxInteractionsInMemory);
    }
    
    // Register entities
    if (context.entities) {
      context.entities.forEach(entity => {
        this.entities.set(entity.id, {
          ...entity,
          lastSeen: Date.now() // Update the last seen timestamp
        });
      });
    }
    
    // Register intentions
    if (context.userIntentions) {
      context.userIntentions.forEach(intention => {
        this.intentions.set(intention.id, intention);
      });
    }
    
    // Register messages
    if (context.recentMessages) {
      context.recentMessages.forEach(message => {
        this.messages.set(message.id, message);
      });
    }
    
    // Register environmental factors
    if (context.environmentalFactors) {
      context.environmentalFactors.forEach(factor => {
        this.environmentalFactors.set(`${factor.type}_${factor.timestamp}`, factor);
      });
    }
    
    // Clean up old entities if we exceed the maximum
    if (this.entities.size > this.maxEntitiesInMemory) {
      this.trimEntities();
    }
  }
  
  /**
   * Retrieve context relevant to the current interaction.
   */
  retrieveRelevantContext(currentInteraction: Interaction, contextualClues: string[] = []): RelevantContext {
    // Start with empty context
    const relevantContext: RelevantContext = {
      entities: [],
      intentions: [],
      messages: [],
      contextualFactors: []
    };
    
    // Get the most recent messages
    const messageIds = new Set<string>();
    this.recentInteractions
      .slice(0, 10)
      .forEach(interaction => {
        messageIds.add(interaction.messageId);
      });
    
    for (const messageId of messageIds) {
      const message = this.messages.get(messageId);
      if (message) {
        relevantContext.messages.push(message);
      }
    }
    
    // Sort messages by timestamp
    relevantContext.messages.sort((a, b) => a.timestamp - b.timestamp);
    
    // Get potentially relevant entities based on current interaction
    const interactionText = JSON.stringify(currentInteraction.contextData).toLowerCase();
    const relatedEntities = Array.from(this.entities.values())
      .filter(entity => {
        // Check if entity is mentioned in the current interaction
        if (
          interactionText.includes(entity.name.toLowerCase()) ||
          interactionText.includes(entity.id.toLowerCase())
        ) {
          return true;
        }
        
        // Check if entity is related to any contextual clues
        for (const clue of contextualClues) {
          if (
            entity.name.toLowerCase().includes(clue.toLowerCase()) ||
            JSON.stringify(entity.attributes).toLowerCase().includes(clue.toLowerCase())
          ) {
            return true;
          }
        }
        
        // Include recently seen entities
        const recencyThreshold = Date.now() - (10 * 60 * 1000); // 10 minutes
        return entity.lastSeen > recencyThreshold;
      })
      .sort((a, b) => b.lastSeen - a.lastSeen) // Sort by recency
      .slice(0, 10); // Limit to 10 most relevant entities
    
    relevantContext.entities = relatedEntities;
    
    // Get recent intentions
    const recentIntentions = Array.from(this.intentions.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3);
    
    relevantContext.intentions = recentIntentions;
    
    // Get recent environmental factors
    const recentFactors = Array.from(this.environmentalFactors.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
    
    relevantContext.contextualFactors = recentFactors;
    
    return relevantContext;
  }
  
  /**
   * Forget irrelevant context to prevent memory overload.
   */
  forgetIrrelevantContext(retentionThreshold: number): void {
    const now = Date.now();
    
    // Forget old interactions
    this.recentInteractions = this.recentInteractions.filter(interaction => {
      return now - interaction.timestamp < retentionThreshold;
    });
    
    // Forget old entities
    for (const [id, entity] of this.entities.entries()) {
      if (now - entity.lastSeen > retentionThreshold) {
        this.entities.delete(id);
      }
    }
    
    // Forget old intentions
    for (const [id, intention] of this.intentions.entries()) {
      if (now - intention.timestamp > retentionThreshold) {
        this.intentions.delete(id);
      }
    }
    
    // Forget old environmental factors
    for (const [id, factor] of this.environmentalFactors.entries()) {
      if (now - factor.timestamp > retentionThreshold) {
        this.environmentalFactors.delete(id);
      }
    }
  }
  
  /**
   * Trim the least recently seen entities when we exceed the maximum.
   */
  private trimEntities(): void {
    // Sort entities by lastSeen time
    const sortedEntities = Array.from(this.entities.entries())
      .sort(([, a], [, b]) => a.lastSeen - b.lastSeen);
    
    // Remove the oldest entities
    const entitiesToRemove = sortedEntities.slice(0, sortedEntities.length - this.maxEntitiesInMemory);
    for (const [id] of entitiesToRemove) {
      this.entities.delete(id);
    }
  }
  
  /**
   * Get all entities in memory.
   */
  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }
  
  /**
   * Get all intentions in memory.
   */
  getAllIntentions(): UserIntention[] {
    return Array.from(this.intentions.values());
  }
  
  /**
   * Get all messages in memory.
   */
  getAllMessages(): Message[] {
    return Array.from(this.messages.values());
  }
  
  /**
   * Get all environmental factors in memory.
   */
  getAllEnvironmentalFactors(): EnvironmentalFactor[] {
    return Array.from(this.environmentalFactors.values());
  }
}
