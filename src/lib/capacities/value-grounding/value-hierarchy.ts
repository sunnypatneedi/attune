import { CoreValue, Context, ValueTension } from '../../types';

/**
 * ValueHierarchy manages relationships between values and helps resolve
 * conflicts when multiple values are relevant to a situation.
 */
export class ValueHierarchy {
  private values: Map<string, CoreValue> = new Map();
  private customPriorities: Map<string, Map<string, number>> = new Map();

  /**
   * Initialize the value hierarchy with core values.
   */
  constructor(coreValues: CoreValue[]) {
    coreValues.forEach(value => {
      this.values.set(value.id, value);
    });
  }

  /**
   * Resolve a conflict between two competing values in a given context.
   */
  resolveConflict(value1: CoreValue, value2: CoreValue, context: Context): CoreValue {
    // Check for custom priority rules in this context
    const customPriority = this.getCustomPriorityInContext(value1.id, value2.id, context);
    if (customPriority !== 0) {
      return customPriority > 0 ? value1 : value2;
    }

    // Check for context-specific applicability
    const value1Applicability = this.getValueApplicability(value1, context);
    const value2Applicability = this.getValueApplicability(value2, context);
    
    const applicabilityDifference = value1Applicability - value2Applicability;
    if (Math.abs(applicabilityDifference) > 0.3) {
      return applicabilityDifference > 0 ? value1 : value2;
    }

    // Fall back to base importance
    return value1.importance >= value2.importance ? value1 : value2;
  }

  /**
   * Get the priority value in a given context from a list of values.
   */
  getPriorityValue(values: CoreValue[], context: Context): CoreValue {
    if (values.length === 0) {
      throw new Error('Cannot determine priority from empty values list');
    }
    
    if (values.length === 1) {
      return values[0];
    }

    // Start with the first value as the current winner
    let currentWinner = values[0];
    
    // Compare with each other value
    for (let i = 1; i < values.length; i++) {
      currentWinner = this.resolveConflict(currentWinner, values[i], context);
    }
    
    return currentWinner;
  }

  /**
   * Set a custom priority between two values for specific context patterns.
   */
  setCustomPriority(value1Id: string, value2Id: string, priorityFactor: number, contextPattern?: Record<string, any>): void {
    // Ensure values exist
    if (!this.values.has(value1Id) || !this.values.has(value2Id)) {
      throw new Error(`Cannot set priority for unknown value(s): ${value1Id}, ${value2Id}`);
    }

    // Create the context pattern key (or use 'default' for general priority)
    const contextKey = contextPattern ? JSON.stringify(contextPattern) : 'default';
    
    // Get or create the map for value1
    if (!this.customPriorities.has(value1Id)) {
      this.customPriorities.set(value1Id, new Map());
    }
    
    const value1Map = this.customPriorities.get(value1Id)!;
    
    // Store the priority map with context pattern
    if (!value1Map.has(value2Id)) {
      value1Map.set(value2Id, new Map());
    }
    
    const contextMap = value1Map.get(value2Id) as any;
    contextMap.set(contextKey, priorityFactor);
  }

  /**
   * Get a custom priority value between two values in a specific context.
   * Returns a positive value if value1 has priority over value2,
   * a negative value if value2 has priority over value1,
   * or 0 if there's no custom priority defined.
   */
  private getCustomPriorityInContext(value1Id: string, value2Id: string, context: Context): number {
    // Check if there are any custom priorities defined for these values
    if (!this.customPriorities.has(value1Id)) {
      return 0;
    }
    
    const value1Map = this.customPriorities.get(value1Id)!;
    if (!value1Map.has(value2Id)) {
      return 0;
    }
    
    const contextMap = value1Map.get(value2Id) as any;
    
    // First check for specific context patterns
    const contextStr = JSON.stringify(context);
    for (const [patternStr, priority] of contextMap.entries()) {
      if (patternStr === 'default') {
        continue; // Skip default for now
      }
      
      const pattern = JSON.parse(patternStr);
      if (this.matchesContextPattern(context, pattern)) {
        return priority;
      }
    }
    
    // Fall back to default if available
    if (contextMap.has('default')) {
      return contextMap.get('default');
    }
    
    return 0;
  }

  /**
   * Check if a context matches a pattern.
   */
  private matchesContextPattern(context: Context, pattern: Record<string, any>): boolean {
    // Simple pattern matching logic - can be extended for more complex patterns
    for (const [key, value] of Object.entries(pattern)) {
      if (!(key in context) || JSON.stringify(context[key as keyof Context]) !== JSON.stringify(value)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Calculate how applicable a value is in a given context.
   * Returns a value between 0 (not applicable) and 1 (highly applicable).
   */
  private getValueApplicability(value: CoreValue, context: Context): number {
    // Base applicability is 0.5
    let applicability = 0.5;

    // Check manifestations for contextual matches
    for (const manifestation of value.manifestations) {
      // Check if this manifestation's context is relevant to the current interaction
      const contextRelevance = this.getManifestationContextRelevance(manifestation, context);
      if (contextRelevance > 0) {
        applicability = Math.max(applicability, 0.5 + (contextRelevance * 0.5));
      }
    }

    return applicability;
  }

  /**
   * Determine how relevant a value manifestation is to the current context.
   * Returns a value between 0 (not relevant) and 1 (highly relevant).
   */
  private getManifestationContextRelevance(manifestation: any, context: Context): number {
    const contextType = manifestation.context;
    
    // Simple string-based matching with predefined contexts
    switch (contextType) {
      case 'information_sharing':
        // Relevant when sharing information or answering questions
        if (this.hasIntentionOfType(context, 'query', 'inquiry', 'information_request')) {
          return 0.9;
        }
        break;
        
      case 'decision_making':
        // Relevant when the user is making a decision
        if (this.hasIntentionOfType(context, 'decision', 'choice', 'selection')) {
          return 1.0;
        }
        break;
        
      case 'disagreement':
        // Relevant when there's disagreement
        if (context.conversationState && context.conversationState.recentSentiment < -0.3) {
          return 0.8;
        }
        break;
        
      case 'emotional_support':
        // Relevant when the user expresses negative emotions
        if (context.conversationState && context.conversationState.recentSentiment < -0.5) {
          return 0.9;
        }
        break;
        
      case 'sensitive_topics':
        // Check for sensitive topics in the conversation
        const sensitiveTopics = ['health', 'politics', 'religion', 'finance', 'personal crisis'];
        if (context.conversationState && 
            context.conversationState.activeTopics.some(topic => 
              sensitiveTopics.some(sensitive => topic.includes(sensitive)))) {
          return 0.7;
        }
        break;
        
      case 'knowledge_sharing':
        // Relevant when sharing factual information
        if (this.hasIntentionOfType(context, 'question', 'factual_query', 'explanation_request')) {
          return 0.8;
        }
        break;
        
      // Add more context matchers as needed
        
      default:
        // For unknown context types, assume moderate relevance if matching text is found
        if (context.recentMessages && context.recentMessages.some(message => 
            message.content && typeof message.content === 'string' && 
            message.content.toLowerCase().includes(contextType.toLowerCase()))) {
          return 0.4;
        }
        return 0.1;
    }
    
    return 0;
  }

  /**
   * Check if the context contains any of the specified intention types.
   */
  private hasIntentionOfType(context: Context, ...types: string[]): boolean {
    return context.userIntentions && context.userIntentions.some(intention => 
      types.some(type => intention.type.includes(type)));
  }

  /**
   * Identify tensions between values in a specific context.
   */
  identifyValueTensions(relevantValues: CoreValue[], context: Context): ValueTension[] {
    const tensions: ValueTension[] = [];
    
    // Compare each pair of values
    for (let i = 0; i < relevantValues.length; i++) {
      for (let j = i + 1; j < relevantValues.length; j++) {
        const value1 = relevantValues[i];
        const value2 = relevantValues[j];
        
        // Check for potential conflict
        const tensionType = this.detectTensionType(value1, value2, context);
        
        if (tensionType) {
          tensions.push({
            valueId1: value1.id,
            valueId2: value2.id,
            tensionType,
            contextElements: this.getRelevantContextElements(value1, value2, context)
          });
        }
      }
    }
    
    return tensions;
  }

  /**
   * Detect the type of tension between two values in a context.
   */
  private detectTensionType(value1: CoreValue, value2: CoreValue, context: Context): 'priority' | 'interpretation' | 'application' | null {
    // Priority tension: values have similar applicability but different importance
    const value1Applicability = this.getValueApplicability(value1, context);
    const value2Applicability = this.getValueApplicability(value2, context);
    
    if (Math.abs(value1Applicability - value2Applicability) < 0.2 && 
        Math.abs(value1.importance - value2.importance) > 0.1) {
      return 'priority';
    }
    
    // Interpretation tension: values could be interpreted differently in this context
    // This is a simplified detection - real implementation would be more sophisticated
    const manifestationOverlap = value1.manifestations.some(m1 => 
      value2.manifestations.some(m2 => m1.context === m2.context && m1.behavior !== m2.behavior));
    
    if (manifestationOverlap) {
      return 'interpretation';
    }
    
    // Application tension: values apply differently depending on how the context is framed
    // This is also simplified
    if (value1Applicability > 0.7 && value2Applicability > 0.7) {
      return 'application';
    }
    
    return null;
  }

  /**
   * Get relevant context elements for a value tension.
   */
  private getRelevantContextElements(value1: CoreValue, value2: CoreValue, context: Context): string[] {
    const elements: string[] = [];
    
    // Get active topics from conversation state
    if (context.conversationState && context.conversationState.activeTopics) {
      elements.push(...context.conversationState.activeTopics);
    }
    
    // Get user intentions
    if (context.userIntentions) {
      elements.push(...context.userIntentions.map(i => i.type));
    }
    
    // Get entities
    if (context.entities) {
      elements.push(...context.entities.map(e => e.name));
    }
    
    return elements;
  }
}
