import { CoreValue, Context, ApplicabilityEnhancement } from '../../types';

/**
 * ContextualValueApplicability determines the relevance of different values
 * in specific contexts, allowing for appropriate value prioritization.
 */
export class ContextualValueApplicability {
  private enhancements: Map<string, ApplicabilityEnhancement[]> = new Map();
  
  /**
   * Determine if a value is relevant in a given context.
   */
  isRelevant(value: CoreValue, context: Context): boolean {
    return this.getApplicabilityScore(value, context) > 0.3;
  }
  
  /**
   * Get values that are relevant to the current context.
   */
  getRelevantValues(context: Context, values: CoreValue[]): CoreValue[] {
    return values.filter(value => this.isRelevant(value, context))
      .sort((a, b) => {
        // Sort by applicability score (descending)
        const scoreA = this.getApplicabilityScore(a, context);
        const scoreB = this.getApplicabilityScore(b, context);
        return scoreB - scoreA;
      });
  }
  
  /**
   * Add enhancements to the applicability calculation.
   */
  enhance(enhancements: ApplicabilityEnhancement[]): void {
    for (const enhancement of enhancements) {
      if (!this.enhancements.has(enhancement.valueId)) {
        this.enhancements.set(enhancement.valueId, []);
      }
      
      this.enhancements.get(enhancement.valueId)!.push(enhancement);
    }
  }
  
  /**
   * Reset enhancements for a specific value.
   */
  resetEnhancements(valueId: string): void {
    this.enhancements.delete(valueId);
  }
  
  /**
   * Reset all enhancements.
   */
  resetAllEnhancements(): void {
    this.enhancements.clear();
  }
  
  /**
   * Get the applicability score for a value in a given context.
   * Returns a value between 0 (not applicable) and 1 (highly applicable).
   */
  private getApplicabilityScore(value: CoreValue, context: Context): number {
    // Base score starts from the value's importance
    let score = value.importance * 0.5; // Scale importance to be half of the initial score
    
    // Check manifestations for contextual matches
    score += this.scoreManifestations(value, context) * 0.3; // Manifestations contribute 30%
    
    // Apply any registered enhancements
    score += this.applyEnhancements(value.id, context) * 0.2; // Enhancements contribute 20%
    
    // Ensure the score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Score how well a value's manifestations match the current context.
   */
  private scoreManifestations(value: CoreValue, context: Context): number {
    if (!value.manifestations || value.manifestations.length === 0) {
      return 0.5; // Default score for values without manifestations
    }
    
    // Score each manifestation and take the maximum
    const manifestationScores = value.manifestations.map(manifestation => 
      this.scoreManifestationMatch(manifestation, context)
    );
    
    // Return the highest match score
    return Math.max(...manifestationScores);
  }
  
  /**
   * Score how well a specific manifestation matches the context.
   */
  private scoreManifestationMatch(manifestation: any, context: Context): number {
    const contextType = manifestation.context;
    
    // Simple string-based matching with predefined contexts
    switch (contextType) {
      case 'information_sharing':
        // Relevant when sharing information or answering questions
        if (this.hasIntentionOfType(context, 'query', 'inquiry', 'information_request')) {
          return 0.9;
        }
        // Less relevant but still applicable for general conversation
        return 0.4;
        
      case 'decision_making':
        // Relevant when the user is making a decision
        if (this.hasIntentionOfType(context, 'decision', 'choice', 'selection')) {
          return 1.0;
        }
        // Check for decision-related words in recent messages
        if (this.containsKeywords(context, ['decide', 'choice', 'option', 'alternative', 'should I'])) {
          return 0.8;
        }
        return 0.3;
        
      case 'disagreement':
        // Relevant when there's disagreement
        if (context.conversationState && context.conversationState.recentSentiment < -0.3) {
          return 0.8;
        }
        // Check for disagreement-related words
        if (this.containsKeywords(context, ['disagree', 'incorrect', 'wrong', 'mistaken', 'not true'])) {
          return 0.7;
        }
        return 0.2;
        
      case 'emotional_support':
        // Relevant when the user expresses negative emotions
        if (context.conversationState && context.conversationState.recentSentiment < -0.5) {
          return 0.9;
        }
        // Check for emotion-related words
        if (this.containsKeywords(context, ['sad', 'upset', 'worried', 'anxious', 'depressed', 'concerned'])) {
          return 0.8;
        }
        return 0.3;
        
      case 'sensitive_topics':
        // Check for sensitive topics in the conversation
        const sensitiveTopics = ['health', 'politics', 'religion', 'finance', 'personal crisis'];
        if (context.conversationState && 
            context.conversationState.activeTopics.some(topic => 
              sensitiveTopics.some(sensitive => topic.includes(sensitive)))) {
          return 0.7;
        }
        // Check for sensitive words
        if (this.containsKeywords(context, sensitiveTopics)) {
          return 0.6;
        }
        return 0.2;
        
      case 'knowledge_sharing':
        // Relevant when sharing factual information
        if (this.hasIntentionOfType(context, 'question', 'factual_query', 'explanation_request')) {
          return 0.8;
        }
        // Check for question-related patterns
        if (this.containsKeywords(context, ['what is', 'how does', 'why is', 'when did', 'where is'])) {
          return 0.7;
        }
        return 0.4;
        
      case 'system_functionality':
        // Relevant when discussing system capabilities
        if (this.hasIntentionOfType(context, 'capability_query', 'help_request', 'how_to')) {
          return 0.9;
        }
        // Check for functionality-related words
        if (this.containsKeywords(context, ['can you', 'how do you', 'feature', 'function', 'capability'])) {
          return 0.7;
        }
        return 0.3;
      
      case 'persuasion':
        // Relevant when persuasion might be involved
        if (this.hasIntentionOfType(context, 'convince', 'persuade', 'recommend')) {
          return 0.8;
        }
        return 0.2;
        
      case 'mistake_handling':
        // Relevant when correcting mistakes
        if (this.containsKeywords(context, ['mistake', 'error', 'wrong', 'incorrect', 'fix'])) {
          return 0.9;
        }
        return 0.3;
        
      case 'data_collection':
      case 'personal_information':
      case 'data_sharing':
        // Relevant for privacy contexts
        if (this.containsKeywords(context, ['data', 'information', 'privacy', 'share', 'collect', 'store'])) {
          return 0.8;
        }
        return 0.3;
        
      case 'language_use':
      case 'cultural_awareness':
      case 'bias_mitigation':
        // Always somewhat relevant for inclusivity
        return 0.5;
        
      case 'identity':
      case 'capabilities':
        // Always relevant for authenticity
        return 0.6;
        
      default:
        // For unknown context types, assume moderate relevance
        return 0.4;
    }
  }
  
  /**
   * Apply registered enhancements to the applicability calculation.
   */
  private applyEnhancements(valueId: string, context: Context): number {
    if (!this.enhancements.has(valueId)) {
      return 0;
    }
    
    const valueEnhancements = this.enhancements.get(valueId)!;
    let enhancementEffect = 0;
    
    for (const enhancement of valueEnhancements) {
      if (this.matchesContextPattern(context, enhancement.contextPattern)) {
        // Apply the modifier - values > 1 increase applicability, < 1 decrease it
        const effect = (enhancement.applicabilityModifier - 1) / 2; // Convert to -0.5 to +0.5 range
        enhancementEffect += effect;
      }
    }
    
    // Cap enhancement effect
    return Math.max(-0.5, Math.min(0.5, enhancementEffect));
  }
  
  /**
   * Check if a context matches a pattern.
   */
  private matchesContextPattern(context: Context, pattern: Record<string, any>): boolean {
    // Simple pattern matching logic
    for (const [key, value] of Object.entries(pattern)) {
      if (!(key in context)) {
        return false;
      }
      
      const contextValue = context[key as keyof Context];
      
      // Handle different types of matching
      if (typeof value === 'string' && typeof contextValue === 'string') {
        if (!contextValue.includes(value)) {
          return false;
        }
      } else if (Array.isArray(value) && Array.isArray(contextValue)) {
        // Check if any value in the pattern array is in the context array
        if (!value.some(v => contextValue.includes(v))) {
          return false;
        }
      } else if (JSON.stringify(contextValue) !== JSON.stringify(value)) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * Check if the context contains any of the specified intention types.
   */
  private hasIntentionOfType(context: Context, ...types: string[]): boolean {
    return context.userIntentions && context.userIntentions.some(intention => 
      types.some(type => intention.type.includes(type)));
  }
  
  /**
   * Check if recent messages contain any of the specified keywords.
   */
  private containsKeywords(context: Context, keywords: string[]): boolean {
    if (!context.recentMessages || context.recentMessages.length === 0) {
      return false;
    }
    
    // Check each message for keywords
    return context.recentMessages.some(message => {
      if (typeof message.content !== 'string') {
        return false;
      }
      
      const content = message.content.toLowerCase();
      return keywords.some(keyword => content.includes(keyword.toLowerCase()));
    });
  }
}
