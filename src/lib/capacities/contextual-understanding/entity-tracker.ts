import { 
  Entity, 
  EntityUpdate, 
  Message, 
  Context 
} from '../../types';

/**
 * EntityTracker is responsible for tracking entities discussed in the conversation.
 * It identifies, stores, and retrieves entity information to maintain conversational context.
 */
export class EntityTracker {
  private entities: Map<string, Entity> = new Map();
  private entityLifespan: Map<string, number> = new Map(); // Tracks entity relevance over time
  private lastCleanupTimestamp: number = Date.now();
  
  /**
   * Identify entities in a new message and update existing entities.
   */
  processMessage(message: Message): Entity[] {
    this.cleanupStaleEntities();
    
    // In a real implementation, this would use NLP to extract entities
    // For now, we'll use a simplified approach for demonstration
    const extractedEntities = this.extractEntitiesFromMessage(message);
    
    // Update or add entities to the tracker
    const updatedEntities: Entity[] = [];
    for (const entity of extractedEntities) {
      this.updateEntity(entity);
      updatedEntities.push(entity);
    }
    
    return updatedEntities;
  }
  
  /**
   * Update an entity with new information.
   */
  updateEntity(entityUpdate: EntityUpdate): Entity {
    const existingEntity = this.entities.get(entityUpdate.id);
    
    if (existingEntity) {
      // Update existing entity
      const updatedEntity: Entity = {
        ...existingEntity,
        lastMentioned: Date.now(),
        attributes: {
          ...existingEntity.attributes,
          ...entityUpdate.attributes
        }
      };
      
      this.entities.set(updatedEntity.id, updatedEntity);
      this.updateEntityLifespan(updatedEntity.id);
      
      return updatedEntity;
    } else {
      // Create new entity
      const newEntity: Entity = {
        id: entityUpdate.id,
        name: entityUpdate.name || entityUpdate.id,
        type: entityUpdate.type || 'unknown',
        firstMentioned: Date.now(),
        lastMentioned: Date.now(),
        attributes: entityUpdate.attributes || {},
        salience: entityUpdate.salience || 0.5
      };
      
      this.entities.set(newEntity.id, newEntity);
      this.entityLifespan.set(newEntity.id, 1); // Initial lifespan
      
      return newEntity;
    }
  }
  
  /**
   * Get all currently tracked entities.
   */
  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }
  
  /**
   * Get a specific entity by ID.
   */
  getEntity(entityId: string): Entity | undefined {
    return this.entities.get(entityId);
  }
  
  /**
   * Get entities that match certain criteria.
   */
  getEntitiesByType(entityType: string): Entity[] {
    return this.getAllEntities().filter(entity => entity.type === entityType);
  }
  
  /**
   * Get the most salient entities (most relevant to current context).
   */
  getSalientEntities(limit: number = 5): Entity[] {
    return this.getAllEntities()
      .sort((a, b) => b.salience - a.salience)
      .slice(0, limit);
  }
  
  /**
   * Get recently mentioned entities.
   */
  getRecentEntities(timeWindowMs: number = 5 * 60 * 1000): Entity[] {
    const now = Date.now();
    return this.getAllEntities().filter(
      entity => (now - entity.lastMentioned) < timeWindowMs
    );
  }
  
  /**
   * Update the lifespan of an entity when it's mentioned.
   */
  private updateEntityLifespan(entityId: string): void {
    const currentLifespan = this.entityLifespan.get(entityId) || 0;
    // Increase lifespan when entity is mentioned
    this.entityLifespan.set(entityId, Math.min(10, currentLifespan + 1));
  }
  
  /**
   * Extract entities from a message.
   * In a real implementation, this would use NLP techniques.
   */
  private extractEntitiesFromMessage(message: Message): Entity[] {
    if (typeof message.content !== 'string') {
      return [];
    }
    
    const entities: Entity[] = [];
    const content = message.content.toLowerCase();
    
    // Simple keyword-based entity extraction (demo only)
    // Format: {entityType:entityName} in the message will be extracted
    const entityPattern = /\{([a-z_]+):([a-z0-9_\s]+)\}/g;
    let match;
    
    while ((match = entityPattern.exec(content)) !== null) {
      const entityType = match[1];
      const entityName = match[2].trim();
      const entityId = `${entityType}_${entityName.replace(/\s+/g, '_')}`;
      
      entities.push({
        id: entityId,
        name: entityName,
        type: entityType,
        firstMentioned: Date.now(),
        lastMentioned: Date.now(),
        attributes: {},
        salience: 0.7 // Default salience for newly extracted entities
      });
    }
    
    // In a real implementation, you would use a named entity recognition system
    // This is just a placeholder for demonstration
    
    return entities;
  }
  
  /**
   * Remove entities that are no longer relevant to the conversation.
   */
  private cleanupStaleEntities(): void {
    const now = Date.now();
    
    // Only clean up occasionally to avoid constant processing
    if (now - this.lastCleanupTimestamp < 60000) { // 1 minute
      return;
    }
    
    this.lastCleanupTimestamp = now;
    
    // Decrease lifespan of all entities
    for (const [entityId, lifespan] of this.entityLifespan.entries()) {
      const entity = this.entities.get(entityId);
      
      if (!entity) {
        this.entityLifespan.delete(entityId);
        continue;
      }
      
      // Decrease lifespan based on time since last mention
      const timeSinceLastMention = now - entity.lastMentioned;
      const newLifespan = lifespan - (timeSinceLastMention / (10 * 60 * 1000)); // Decrease by 1 every 10 minutes
      
      if (newLifespan <= 0) {
        // Entity is no longer relevant
        this.entities.delete(entityId);
        this.entityLifespan.delete(entityId);
      } else {
        this.entityLifespan.set(entityId, newLifespan);
        
        // Also decrease salience over time
        entity.salience = Math.max(0.1, entity.salience * 0.95);
        this.entities.set(entityId, entity);
      }
    }
  }
  
  /**
   * Load entities from context.
   */
  loadFromContext(context: Context): void {
    if (context.entities) {
      for (const entity of context.entities) {
        this.entities.set(entity.id, entity);
        // Set a reasonable lifespan based on recency
        const timeSinceLastMention = Date.now() - entity.lastMentioned;
        const lifespan = 10 - Math.min(9, Math.floor(timeSinceLastMention / (10 * 60 * 1000)));
        this.entityLifespan.set(entity.id, Math.max(1, lifespan));
      }
    }
  }
  
  /**
   * Get entities for the current context.
   */
  getEntitiesForContext(): Entity[] {
    // Get entities with a lifespan above threshold
    return this.getAllEntities().filter(entity => {
      const lifespan = this.entityLifespan.get(entity.id) || 0;
      return lifespan >= 0.5; // Only include entities that are still somewhat relevant
    });
  }
  
  /**
   * Reset the entity tracker.
   */
  reset(): void {
    this.entities.clear();
    this.entityLifespan.clear();
    this.lastCleanupTimestamp = Date.now();
  }
}
