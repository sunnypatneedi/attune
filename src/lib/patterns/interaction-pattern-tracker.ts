import { 
  EnhancedMessage, 
  InteractionEvent, 
  InteractionPattern, 
  PatternType, 
  Intention,
  IntentionType,
  Entity
} from '../enhanced-types';

/**
 * Tracks and identifies patterns in user interactions over time.
 */
export class InteractionPatternTracker {
  private interactionHistory: InteractionEvent[] = [];
  private patterns: InteractionPattern[] = [];
  private maxHistorySize: number = 100;
  
  constructor() {}
  
  /**
   * Add a new message interaction to the history
   * @param message Message to track
   */
  trackMessage(message: EnhancedMessage): void {
    // Create interaction event from message
    const event: InteractionEvent = {
      timestamp: message.timestamp,
      type: 'message',
      data: {
        message,
        intention: message.primaryIntention?.type || IntentionType.UNKNOWN,
        entities: message.entities || []
      }
    };
    
    // Add to history
    this.trackEvent(event);
    
    // Analyze for new patterns
    this.analyzePatterns();
  }
  
  /**
   * Track any interaction event
   * @param event Event to track
   */
  trackEvent(event: InteractionEvent): void {
    this.interactionHistory.push(event);
    
    // Keep history size limited
    if (this.interactionHistory.length > this.maxHistorySize) {
      this.interactionHistory.shift();
    }
  }
  
  /**
   * Analyze the interaction history to identify patterns
   */
  private analyzePatterns(): void {
    // Run different types of pattern analysis
    this.detectSequentialPatterns();
    this.detectTemporalPatterns();
    this.detectFrequencyPatterns();
  }
  
  /**
   * Detect sequential patterns in interactions
   * (e.g., user frequently asks a question after greeting)
   */
  private detectSequentialPatterns(): void {
    // Need at least 3 interactions to detect sequential patterns
    if (this.interactionHistory.length < 3) return;
    
    // Get message events only
    const messageEvents = this.interactionHistory.filter(
      event => event.type === 'message' && event.data.message.sender === 'user'
    );
    
    // Need at least 3 messages
    if (messageEvents.length < 3) return;
    
    // Look for intention sequences
    const intentionSequences: Record<string, number> = {};
    
    // Check for 2-step sequences
    for (let i = 0; i < messageEvents.length - 1; i++) {
      const firstIntention = messageEvents[i].data.intention;
      const secondIntention = messageEvents[i + 1].data.intention;
      
      const sequenceKey = `${firstIntention}→${secondIntention}`;
      intentionSequences[sequenceKey] = (intentionSequences[sequenceKey] || 0) + 1;
    }
    
    // Check for 3-step sequences
    for (let i = 0; i < messageEvents.length - 2; i++) {
      const firstIntention = messageEvents[i].data.intention;
      const secondIntention = messageEvents[i + 1].data.intention;
      const thirdIntention = messageEvents[i + 2].data.intention;
      
      const sequenceKey = `${firstIntention}→${secondIntention}→${thirdIntention}`;
      intentionSequences[sequenceKey] = (intentionSequences[sequenceKey] || 0) + 1;
    }
    
    // Find frequent sequences (at least 2 occurrences)
    for (const [sequence, count] of Object.entries(intentionSequences)) {
      if (count >= 2) {
        // Check if we already identified this pattern
        const patternExists = this.patterns.some(pattern => 
          pattern.type === PatternType.SEQUENTIAL && 
          pattern.metadata?.sequenceKey === sequence
        );
        
        if (!patternExists) {
          // Add new pattern
          const now = Date.now();
          const parts = sequence.split('→');
          
          this.patterns.push({
            type: PatternType.SEQUENTIAL,
            description: `User often follows ${this.formatIntention(parts[0])} with ${this.formatIntention(parts[parts.length - 1])}`,
            confidence: Math.min(0.5 + (count * 0.1), 0.9), // More occurrences = higher confidence
            occurrences: count,
            firstObservedAt: now,
            lastObservedAt: now,
            elements: parts,
            metadata: {
              sequenceKey: sequence,
              sequenceParts: parts
            }
          });
        } else {
          // Update existing pattern
          this.patterns = this.patterns.map(pattern => {
            if (pattern.type === PatternType.SEQUENTIAL && pattern.metadata?.sequenceKey === sequence) {
              return {
                ...pattern,
                occurrences: pattern.occurrences + 1,
                lastObservedAt: Date.now(),
                confidence: Math.min(0.5 + ((pattern.occurrences + 1) * 0.1), 0.9)
              };
            }
            return pattern;
          });
        }
      }
    }
  }
  
  /**
   * Format intention type for human-readable descriptions
   */
  private formatIntention(intentionType: string): string {
    // Convert SNAKE_CASE to "sentence case"
    return intentionType
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
  
  /**
   * Detect temporal patterns in interactions
   * (e.g., user tends to interact at specific times)
   */
  private detectTemporalPatterns(): void {
    // Need at least 5 interactions to detect temporal patterns
    if (this.interactionHistory.length < 5) return;
    
    // Extract user message events
    const userMessages = this.interactionHistory.filter(
      event => event.type === 'message' && event.data.message.sender === 'user'
    );
    
    // Need at least 5 user messages
    if (userMessages.length < 5) return;
    
    // Check for time-of-day patterns
    const hourDistribution: Record<number, number> = {};
    
    for (const event of userMessages) {
      const hour = new Date(event.timestamp).getHours();
      hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;
    }
    
    // Find hours with high activity (at least 3 messages in same hour)
    for (const [hour, count] of Object.entries(hourDistribution)) {
      if (count >= 3) {
        const hourNum = parseInt(hour);
        const timeRange = `${hourNum}:00-${hourNum}:59`;
        
        // Check if we already identified this pattern
        const patternExists = this.patterns.some(pattern => 
          pattern.type === PatternType.TEMPORAL && 
          pattern.metadata?.timeRange === timeRange
        );
        
        if (!patternExists) {
          // Format time for description
          const formattedHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
          const amPm = hourNum < 12 ? 'AM' : 'PM';
          
          // Add new pattern
          this.patterns.push({
            type: PatternType.TEMPORAL,
            description: `User is often active around ${formattedHour} ${amPm}`,
            confidence: Math.min(0.5 + (count * 0.1), 0.9),
            occurrences: count,
            firstObservedAt: Date.now(),
            lastObservedAt: Date.now(),
            elements: userMessages.filter(e => new Date(e.timestamp).getHours() === hourNum),
            metadata: {
              timeRange,
              hour: hourNum
            }
          });
        } else {
          // Update existing pattern
          this.patterns = this.patterns.map(pattern => {
            if (pattern.type === PatternType.TEMPORAL && pattern.metadata?.timeRange === timeRange) {
              return {
                ...pattern,
                occurrences: pattern.occurrences + 1,
                lastObservedAt: Date.now(),
                confidence: Math.min(0.5 + ((pattern.occurrences + 1) * 0.1), 0.9)
              };
            }
            return pattern;
          });
        }
      }
    }
  }
  
  /**
   * Detect frequency patterns in interactions
   * (e.g., user frequently asks about a specific topic)
   */
  private detectFrequencyPatterns(): void {
    // Get user message events
    const userMessages = this.interactionHistory.filter(
      event => event.type === 'message' && event.data.message.sender === 'user'
    );
    
    // Need at least 3 messages
    if (userMessages.length < 3) return;
    
    // Track intention frequencies
    const intentionCounts: Record<string, number> = {};
    
    for (const event of userMessages) {
      const intention = event.data.intention;
      intentionCounts[intention] = (intentionCounts[intention] || 0) + 1;
    }
    
    // Find frequent intentions (at least 3 occurrences)
    for (const [intention, count] of Object.entries(intentionCounts)) {
      if (count >= 3 && count / userMessages.length >= 0.25) { // At least 25% of messages
        // Check if we already identified this pattern
        const patternExists = this.patterns.some(pattern => 
          pattern.type === PatternType.FREQUENCY && 
          pattern.metadata?.frequentItem === intention &&
          pattern.metadata?.itemType === 'intention'
        );
        
        if (!patternExists) {
          // Add new pattern
          this.patterns.push({
            type: PatternType.FREQUENCY,
            description: `User frequently expresses ${this.formatIntention(intention)}`,
            confidence: Math.min(0.5 + (count * 0.1), 0.9),
            occurrences: count,
            firstObservedAt: Date.now(),
            lastObservedAt: Date.now(),
            elements: userMessages.filter(e => e.data.intention === intention),
            metadata: {
              frequentItem: intention,
              itemType: 'intention',
              frequency: count / userMessages.length
            }
          });
        } else {
          // Update existing pattern
          this.patterns = this.patterns.map(pattern => {
            if (pattern.type === PatternType.FREQUENCY && 
                pattern.metadata?.frequentItem === intention &&
                pattern.metadata?.itemType === 'intention') {
              return {
                ...pattern,
                occurrences: count,
                lastObservedAt: Date.now(),
                confidence: Math.min(0.5 + (count * 0.1), 0.9),
                metadata: {
                  ...pattern.metadata,
                  frequency: count / userMessages.length
                }
              };
            }
            return pattern;
          });
        }
      }
    }
    
    // Track entity frequencies
    const entityCounts: Record<string, number> = {};
    
    for (const event of userMessages) {
      if (event.data.entities) {
        for (const entity of event.data.entities as Entity[]) {
          const entityKey = `${entity.type}:${entity.normalizedValue || entity.value}`;
          entityCounts[entityKey] = (entityCounts[entityKey] || 0) + 1;
        }
      }
    }
    
    // Find frequently mentioned entities (at least 2 occurrences)
    for (const [entityKey, count] of Object.entries(entityCounts)) {
      if (count >= 2) {
        // Check if we already identified this pattern
        const patternExists = this.patterns.some(pattern => 
          pattern.type === PatternType.FREQUENCY && 
          pattern.metadata?.frequentItem === entityKey &&
          pattern.metadata?.itemType === 'entity'
        );
        
        const [entityType, entityValue] = entityKey.split(':', 2);
        
        if (!patternExists) {
          // Add new pattern
          this.patterns.push({
            type: PatternType.FREQUENCY,
            description: `User frequently mentions ${entityValue} (${entityType})`,
            confidence: Math.min(0.5 + (count * 0.1), 0.9),
            occurrences: count,
            firstObservedAt: Date.now(),
            lastObservedAt: Date.now(),
            elements: userMessages.filter(e => 
              e.data.entities && e.data.entities.some((entity: Entity) => 
                `${entity.type}:${entity.normalizedValue || entity.value}` === entityKey
              )
            ),
            metadata: {
              frequentItem: entityKey,
              itemType: 'entity',
              entityType,
              entityValue
            }
          });
        } else {
          // Update existing pattern
          this.patterns = this.patterns.map(pattern => {
            if (pattern.type === PatternType.FREQUENCY && 
                pattern.metadata?.frequentItem === entityKey &&
                pattern.metadata?.itemType === 'entity') {
              return {
                ...pattern,
                occurrences: count,
                lastObservedAt: Date.now(),
                confidence: Math.min(0.5 + (count * 0.1), 0.9)
              };
            }
            return pattern;
          });
        }
      }
    }
  }
  
  /**
   * Get all identified patterns
   * @returns Array of detected patterns
   */
  getPatterns(): InteractionPattern[] {
    return [...this.patterns];
  }
  
  /**
   * Get patterns of a specific type
   * @param type Pattern type to filter by
   * @returns Array of patterns of the specified type
   */
  getPatternsByType(type: PatternType): InteractionPattern[] {
    return this.patterns.filter(pattern => pattern.type === type);
  }
  
  /**
   * Get patterns above a certain confidence threshold
   * @param minConfidence Minimum confidence threshold (0.0 to 1.0)
   * @returns Array of high-confidence patterns
   */
  getHighConfidencePatterns(minConfidence: number = 0.7): InteractionPattern[] {
    return this.patterns.filter(pattern => pattern.confidence >= minConfidence);
  }
  
  /**
   * Get the most relevant patterns for the current interaction context
   * @param currentIntention The current user intention
   * @param recentEntities Recent entities mentioned
   * @returns Array of relevant patterns
   */
  getRelevantPatterns(currentIntention?: string, recentEntities?: string[]): InteractionPattern[] {
    // No intention or entities means no relevant patterns
    if (!currentIntention && (!recentEntities || recentEntities.length === 0)) {
      return this.getHighConfidencePatterns(0.8); // Return only the most confident patterns
    }
    
    return this.patterns.filter(pattern => {
      // Check sequential patterns
      if (pattern.type === PatternType.SEQUENTIAL && 
          pattern.metadata?.sequenceParts &&
          pattern.metadata.sequenceParts[0] === currentIntention) {
        return true;
      }
      
      // Check frequency patterns for entities
      if (pattern.type === PatternType.FREQUENCY && 
          pattern.metadata?.itemType === 'entity' &&
          recentEntities?.includes(pattern.metadata.entityValue)) {
        return true;
      }
      
      // Include very high confidence patterns regardless
      return pattern.confidence > 0.85;
    });
  }
  
  /**
   * Reset all tracked patterns
   */
  resetPatterns(): void {
    this.patterns = [];
  }
}
