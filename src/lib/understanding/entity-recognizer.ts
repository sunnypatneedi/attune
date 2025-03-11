import { Entity, EntityType } from '../enhanced-types';

/**
 * A utility class that analyzes text to detect entities.
 * This implementation uses simple rule-based detection, but could be
 * replaced with a more sophisticated NER (Named Entity Recognition) approach.
 */
export class EntityRecognizer {
  private entityPatterns: Map<EntityType, RegExp[]> = new Map<EntityType, RegExp[]>();
  private entityLists: Map<EntityType, string[]> = new Map<EntityType, string[]>();
  
  constructor() {
    this.initializePatterns();
  }
  
  /**
   * Initialize patterns and lists for entity recognition
   */
  private initializePatterns(): void {
    // Regex patterns for each entity type
    this.entityPatterns = new Map<EntityType, RegExp[]>([
      // Person patterns (names with titles, etc.)
      [EntityType.PERSON, [
        /\b(Mr|Mrs|Ms|Dr|Prof)\.\s+[A-Z][a-z]+\b/g,
        /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g // Simplified person name pattern
      ]],
      
      // Location patterns
      [EntityType.LOCATION, [
        /\b(in|at|from|to)\s+([A-Z][a-z]+(\s+[A-Z][a-z]+)*)\b/g, // Locations often follow prepositions
        /\b[A-Z][a-z]+\s+(Street|Avenue|Road|Blvd|Drive|Lane|Place|Court|Way)\b/g
      ]],
      
      // Organization patterns
      [EntityType.ORGANIZATION, [
        /\b[A-Z][a-z]*\s*(Inc|LLC|Corp|Corporation|Company|Co|Ltd)\b/g,
        /\b(University|College) of [A-Z][a-z]+\b/g
      ]],
      
      // Date/Time patterns
      [EntityType.DATE_TIME, [
        /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(st|nd|rd|th)?(,\s+\d{4})?\b/gi,
        /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g,
        /\b(today|tomorrow|yesterday|next|last)\s+(day|week|month|year)\b/gi,
        /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi,
        /\b\d{1,2}:\d{2}\s*(am|pm|AM|PM)?\b/g
      ]],
      
      // Duration patterns
      [EntityType.DURATION, [
        /\b\d+\s+(second|minute|hour|day|week|month|year)s?\b/gi,
        /\b(several|a few|many)\s+(second|minute|hour|day|week|month|year)s?\b/gi
      ]],
      
      // Product patterns
      [EntityType.PRODUCT, [
        /\b[A-Z][a-z]*\s+\d+\b/g, // Product models often follow this pattern (iPhone 12, Windows 10)
        /\b[A-Z][a-z]+\s+(Pro|Lite|Max|Ultra|Plus)\b/g
      ]],
      
      // Event patterns
      [EntityType.EVENT, [
        /\b(conference|meeting|wedding|party|festival|concert|seminar|webinar|workshop)\b/gi
      ]],
      
      // Topic patterns
      [EntityType.TOPIC, [
        /\b(regarding|about|on the topic of|concerning|discussing)\s+([a-z]+(\s+[a-z]+)*)\b/gi
      ]],
      
      // Task patterns
      [EntityType.TASK, [
        /\b(task|job|assignment|project|work item)\b/gi,
        /\b(need to|have to|must|should)\s+([a-z]+(\s+[a-z]+)*)\b/gi
      ]],
      
      // Preference patterns
      [EntityType.PREFERENCE, [
        /\b(prefer|like|love|enjoy|hate|dislike)\s+([a-z]+(\s+[a-z]+)*)\b/gi,
        /\b(favorite|preferred)\s+([a-z]+(\s+[a-z]+)*)\b/gi
      ]]
    ]);
    
    // Lists of common entities
    this.entityLists = new Map<EntityType, string[]>([
      [EntityType.LOCATION, [
        'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
        'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
        'London', 'Paris', 'Tokyo', 'Beijing', 'Moscow', 'Berlin', 'Rome'
      ]],
      
      [EntityType.ORGANIZATION, [
        'Google', 'Microsoft', 'Apple', 'Amazon', 'Facebook', 'Netflix',
        'Tesla', 'SpaceX', 'IBM', 'Intel', 'AMD', 'Nvidia', 'Samsung',
        'Zoom', 'Twitter', 'LinkedIn'
      ]],
      
      [EntityType.PRODUCT, [
        'iPhone', 'iPad', 'MacBook', 'Surface', 'Windows', 'Android',
        'Chrome', 'Firefox', 'Safari', 'Office', 'Teams', 'Slack'
      ]],
      
      [EntityType.TOPIC, [
        'AI', 'machine learning', 'data science', 'web development',
        'mobile development', 'cloud computing', 'cybersecurity',
        'blockchain', 'cryptocurrency', 'climate change', 'renewable energy',
        'politics', 'economics', 'health', 'education', 'technology'
      ]]
    ]);
  }
  
  /**
   * Recognize entities in text
   * @param text The text to analyze for entities
   * @returns Array of detected entities
   */
  recognizeEntities(text: string): Entity[] {
    const entities: Entity[] = [];
    
    // First pass: use regex patterns
    for (const [entityType, patterns] of this.entityPatterns.entries()) {
      for (const pattern of patterns) {
        // Create a new RegExp with the same pattern but using the global flag
        // This is needed because we need to reset the regex object's lastIndex
        const regex = new RegExp(pattern.source, 'g');
        
        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
          // Extract the entity value based on the pattern
          let value: string;
          
          // Handle special patterns with capture groups
          if (entityType === EntityType.LOCATION && match[2]) {
            value = match[2]; // The location after a preposition
          } else if (entityType === EntityType.TOPIC && match[2]) {
            value = match[2]; // The topic after "about", "regarding", etc.
          } else if (entityType === EntityType.TASK && match[2]) {
            value = match[2]; // The task after "need to", "have to", etc.
          } else if (entityType === EntityType.PREFERENCE && match[2]) {
            value = match[2]; // The preference after "like", "prefer", etc.
          } else {
            value = match[0]; // The full match
          }
          
          // Create entity object
          entities.push({
            type: entityType,
            value: value.trim(),
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            confidence: 0.8, // High confidence for pattern matches
          });
        }
      }
    }
    
    // Second pass: check for known entities in lists
    for (const [entityType, list] of this.entityLists.entries()) {
      for (const item of list) {
        // Case-insensitive search for the item
        const itemRegex = new RegExp(`\\b${this.escapeRegExp(item)}\\b`, 'gi');
        
        let match: RegExpExecArray | null;
        while ((match = itemRegex.exec(text)) !== null) {
          // Check if this match overlaps with any existing entities
          const overlaps = entities.some(entity => 
            (match!.index >= (entity.startIndex || 0) && match!.index < (entity.endIndex || 0)) ||
            (match!.index + match![0].length > (entity.startIndex || 0) && match!.index + match![0].length <= (entity.endIndex || 0))
          );
          
          if (!overlaps) {
            entities.push({
              type: entityType,
              value: match[0],
              startIndex: match.index,
              endIndex: match.index + match[0].length,
              confidence: 0.9, // Very high confidence for list matches
            });
          }
        }
      }
    }
    
    // Third pass: handle common entity types not covered by patterns or lists
    
    // Extract potential concepts (important noun phrases not otherwise categorized)
    this.extractConcepts(text, entities);
    
    // Remove overlapping entities (keep the one with highest confidence)
    return this.resolveOverlappingEntities(entities);
  }
  
  /**
   * Extract concepts from text (common nouns and noun phrases)
   * @param text The text to analyze
   * @param entities Existing entities array to append to
   */
  private extractConcepts(text: string, entities: Entity[]): void {
    // This is a very simplified concept extraction
    // In a real implementation, this would use POS tagging and chunking
    
    // Look for capitalized phrases that might be concepts
    const conceptRegex = /\b[A-Z][a-z]+(\s+[A-Z][a-z]+)*\b/g;
    
    let match;
    while ((match = conceptRegex.exec(text)) !== null) {
      // Check if this match overlaps with any existing entities
      const overlaps = entities.some(entity => 
        (match.index >= entity.startIndex && match.index < entity.endIndex) ||
        (match.index + match[0].length > entity.startIndex && match.index + match[0].length <= entity.endIndex)
      );
      
      if (!overlaps) {
        entities.push({
          type: EntityType.CONCEPT,
          value: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          confidence: 0.6, // Medium confidence for concept extraction
        });
      }
    }
  }
  
  /**
   * Resolve overlapping entities by keeping the one with highest confidence
   * @param entities Array of entities that may overlap
   * @returns Filtered array with overlaps resolved
   */
  private resolveOverlappingEntities(entities: Entity[]): Entity[] {
    if (entities.length <= 1) return entities;
    
    // Sort entities by start index for efficient overlap checking
    const sortedEntities = [...entities].sort((a, b) => 
      (a.startIndex || 0) - (b.startIndex || 0)
    );
    
    const result: Entity[] = [];
    let currentEntity = sortedEntities[0];
    
    for (let i = 1; i < sortedEntities.length; i++) {
      const nextEntity = sortedEntities[i];
      
      // Check for overlap
      if ((currentEntity.startIndex || 0) <= (nextEntity.startIndex || 0) && 
          (currentEntity.endIndex || 0) > (nextEntity.startIndex || 0)) {
        
        // Keep the entity with higher confidence
        if (nextEntity.confidence > currentEntity.confidence) {
          currentEntity = nextEntity;
        }
        // If equal confidence, prefer longer entity
        else if (nextEntity.confidence === currentEntity.confidence && 
                (nextEntity.endIndex || 0) - (nextEntity.startIndex || 0) > 
                (currentEntity.endIndex || 0) - (currentEntity.startIndex || 0)) {
          currentEntity = nextEntity;
        }
        // Otherwise keep current entity
      } else {
        // No overlap, add current entity to result and move to next
        result.push(currentEntity);
        currentEntity = nextEntity;
      }
    }
    
    // Add the last entity
    result.push(currentEntity);
    
    // Add metadata to indicate first and most recent mention
    const now = Date.now();
    return result.map(entity => ({
      ...entity,
      firstMentionedAt: now,
      lastMentionedAt: now,
      mentionCount: 1
    }));
  }
  
  /**
   * Escape special regex characters in a string
   * @param str String to escape
   * @returns Escaped string safe for regex
   */
  private escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  /**
   * Update entity tracking information when an entity is mentioned again
   * @param existingEntity Previously detected entity
   * @param newMention New detection of the same entity
   * @returns Updated entity with tracking information
   */
  updateEntityTracking(existingEntity: Entity, newMention: Entity): Entity {
    return {
      ...existingEntity,
      lastMentionedAt: Date.now(),
      mentionCount: (existingEntity.mentionCount || 1) + 1,
      // Keep the higher confidence
      confidence: Math.max(existingEntity.confidence, newMention.confidence),
      // Merge attributes if they exist
      attributes: { 
        ...(existingEntity.attributes || {}), 
        ...(newMention.attributes || {}) 
      }
    };
  }
  
  /**
   * Normalize entity values for easier comparison
   * @param entity Entity to normalize
   * @returns Entity with normalized value
   */
  normalizeEntity(entity: Entity): Entity {
    if (entity.normalizedValue) return entity;
    
    // Simple normalization: lowercase and trim
    let normalizedValue = entity.value.toLowerCase().trim();
    
    // Type-specific normalizations
    switch (entity.type) {
      case EntityType.PERSON:
        // Remove titles like Mr., Mrs., etc.
        normalizedValue = normalizedValue.replace(/^(mr|mrs|ms|dr|prof)\.\s+/i, '');
        break;
        
      case EntityType.DATE_TIME:
        // Could implement date parsing/normalization
        // For now, just basic normalization
        break;
        
      case EntityType.DURATION:
        // Could normalize to standard time units
        break;
        
      default:
        // Use basic normalization
        break;
    }
    
    return {
      ...entity,
      normalizedValue
    };
  }
  
  /**
   * Check if two entities refer to the same real-world entity
   * @param entity1 First entity
   * @param entity2 Second entity
   * @returns True if entities likely refer to the same thing
   */
  isSameEntity(entity1: Entity, entity2: Entity): boolean {
    // Different types can't be the same entity
    if (entity1.type !== entity2.type) return false;
    
    // Normalize both entities
    const norm1 = this.normalizeEntity(entity1);
    const norm2 = this.normalizeEntity(entity2);
    
    // Compare normalized values
    return norm1.normalizedValue === norm2.normalizedValue;
  }
}
