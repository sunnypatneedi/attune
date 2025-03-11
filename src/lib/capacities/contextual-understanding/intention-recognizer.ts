import { 
  UserIntention, 
  Message, 
  IntentionType,
  Context,
  Entity
} from '../../types';

/**
 * IntentionRecognizer identifies and tracks user intentions throughout a conversation.
 * It analyzes messages to determine what the user is trying to accomplish.
 */
export class IntentionRecognizer {
  private activeIntentions: Map<string, UserIntention> = new Map();
  private intentionHistory: UserIntention[] = [];
  private intentionPatterns: Map<IntentionType, RegExp[]> = new Map();
  
  constructor() {
    this.initializeIntentionPatterns();
  }
  
  /**
   * Recognize intentions in a new message.
   */
  recognizeIntentions(message: Message, context: Context): UserIntention[] {
    // Skip processing non-user messages
    if (message.role !== 'user') {
      return [];
    }
    
    this.updateIntentionLifespans();
    
    // In a real implementation, this would use NLP and ML techniques
    // For now, we'll use a pattern-based approach for demonstration
    const recognizedIntentions = this.extractIntentionsFromMessage(message, context);
    
    // Update or add intentions
    for (const intention of recognizedIntentions) {
      this.updateIntention(intention);
    }
    
    return recognizedIntentions;
  }
  
  /**
   * Update an intention's status and attributes.
   */
  updateIntention(intention: UserIntention): void {
    const existingIntention = this.activeIntentions.get(intention.id);
    
    if (existingIntention) {
      // Update existing intention
      const updatedIntention: UserIntention = {
        ...existingIntention,
        lastDetected: Date.now(),
        confidence: Math.max(existingIntention.confidence, intention.confidence),
        status: intention.status || existingIntention.status,
        relatedEntities: [
          ...new Set([
            ...(existingIntention.relatedEntities || []),
            ...(intention.relatedEntities || [])
          ])
        ]
      };
      
      this.activeIntentions.set(updatedIntention.id, updatedIntention);
    } else {
      // Create new intention
      const newIntention: UserIntention = {
        ...intention,
        firstDetected: Date.now(),
        lastDetected: Date.now(),
        status: intention.status || 'active'
      };
      
      this.activeIntentions.set(newIntention.id, newIntention);
      this.intentionHistory.push(newIntention);
    }
  }
  
  /**
   * Mark an intention as complete.
   */
  completeIntention(intentionId: string): void {
    const intention = this.activeIntentions.get(intentionId);
    
    if (intention) {
      intention.status = 'completed';
      intention.completedTimestamp = Date.now();
      
      // Keep completed intentions in the active list for a short while
      setTimeout(() => {
        this.activeIntentions.delete(intentionId);
      }, 5 * 60 * 1000); // 5 minutes
    }
  }
  
  /**
   * Get all currently active intentions.
   */
  getActiveIntentions(): UserIntention[] {
    return Array.from(this.activeIntentions.values())
      .filter(intention => intention.status === 'active');
  }
  
  /**
   * Get the most likely primary user intention.
   */
  getPrimaryIntention(): UserIntention | undefined {
    const active = this.getActiveIntentions();
    
    if (active.length === 0) {
      return undefined;
    }
    
    // Sort by confidence and recency
    const sorted = active.sort((a, b) => {
      // Weight confidence more heavily than recency
      const confidenceWeight = 0.7;
      const recencyWeight = 0.3;
      
      const confidenceScore = (b.confidence - a.confidence) * confidenceWeight;
      const recencyScore = (b.lastDetected - a.lastDetected) * recencyWeight;
      
      return confidenceScore + recencyScore;
    });
    
    return sorted[0];
  }
  
  /**
   * Get intentions of a specific type.
   */
  getIntentionsByType(type: IntentionType): UserIntention[] {
    return this.getActiveIntentions().filter(
      intention => intention.type === type
    );
  }
  
  /**
   * Get intentions related to a specific entity.
   */
  getIntentionsForEntity(entityId: string): UserIntention[] {
    return this.getActiveIntentions().filter(
      intention => intention.relatedEntities && intention.relatedEntities.includes(entityId)
    );
  }
  
  /**
   * Initialize patterns for recognizing common intention types.
   * This is a simplified demonstration - real systems would use ML models.
   */
  private initializeIntentionPatterns(): void {
    // Information seeking
    this.intentionPatterns.set('information_request', [
      /what is|what are|tell me about|do you know|can you explain|how does|why is|when was/i,
      /looking for information|need to find|searching for|trying to understand/i
    ]);
    
    // Task completion
    this.intentionPatterns.set('task_request', [
      /can you help me|could you|would you|please|i need you to|create|make|generate|calculate/i,
      /need assistance with|assist me in|help me with|support me in/i
    ]);
    
    // Problem solving
    this.intentionPatterns.set('problem_solving', [
      /how can i|how do i|what's the best way to|what should i do about|troubleshoot|debug|figure out/i,
      /having trouble with|struggling with|can't figure out|need to solve|issue with/i
    ]);
    
    // Opinion seeking
    this.intentionPatterns.set('opinion_request', [
      /what do you think|your opinion|do you believe|would you recommend|better option/i,
      /which is better|what's your take on|thoughts on|impression of|recommend/i
    ]);
    
    // Emotional support
    this.intentionPatterns.set('emotional_support', [
      /i feel|i'm feeling|i am feeling|i'm stressed|i'm anxious|i'm worried|i'm upset/i,
      /frustrated with|sad about|concerned about|worried about|nervous about/i
    ]);
    
    // Clarification
    this.intentionPatterns.set('clarification', [
      /what do you mean|can you clarify|i don't understand|could you explain|confused about/i,
      /meaning of|clarify|elaborate on|more detail about|be more specific/i
    ]);
    
    // Small talk
    this.intentionPatterns.set('small_talk', [
      /how are you|nice to meet|good morning|good afternoon|good evening|hello|hi there/i,
      /what's up|how's it going|nice day|weather|weekend plans|holiday/i
    ]);
    
    // Preference expression
    this.intentionPatterns.set('preference_expression', [
      /i like|i prefer|i enjoy|i want|i don't like|i hate|i love/i,
      /favorite|preference|rather have|rather not|instead of/i
    ]);
    
    // Decision making
    this.intentionPatterns.set('decision_making', [
      /should i|which should|help me decide|trying to choose|decide between/i,
      /pros and cons|advantages of|disadvantages of|benefits of|drawbacks of/i
    ]);
  }
  
  /**
   * Extract intentions from a message.
   */
  private extractIntentionsFromMessage(message: Message, context: Context): UserIntention[] {
    if (typeof message.content !== 'string') {
      return [];
    }
    
    const content = message.content;
    const intentions: UserIntention[] = [];
    
    // Check each intention type pattern
    for (const [intentionType, patterns] of this.intentionPatterns.entries()) {
      let matched = false;
      let matchStrength = 0;
      
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          matched = true;
          matchStrength += 0.1; // Increase match strength for each matching pattern
        }
      }
      
      if (matched) {
        // Create a new intention
        const intentionId = `${intentionType}_${Date.now()}`;
        const relatedEntities = this.findRelatedEntities(content, context.entities);
        
        intentions.push({
          id: intentionId,
          type: intentionType as IntentionType,
          firstDetected: Date.now(),
          lastDetected: Date.now(),
          confidence: Math.min(0.9, 0.5 + matchStrength),
          status: 'active',
          relatedEntities: relatedEntities
        });
      }
    }
    
    // If we couldn't detect any specific intention, add a generic one
    if (intentions.length === 0) {
      intentions.push({
        id: `general_communication_${Date.now()}`,
        type: 'general_communication',
        firstDetected: Date.now(),
        lastDetected: Date.now(),
        confidence: 0.3,
        status: 'active'
      });
    }
    
    return intentions;
  }
  
  /**
   * Find entities related to the intentions in the message.
   */
  private findRelatedEntities(content: string, contextEntities: Entity[]): string[] {
    const relatedEntityIds: string[] = [];
    
    for (const entity of contextEntities) {
      // Check if entity name appears in the content
      if (content.toLowerCase().includes(entity.name.toLowerCase())) {
        relatedEntityIds.push(entity.id);
      }
    }
    
    return relatedEntityIds;
  }
  
  /**
   * Update the lifespan of intentions and remove stale ones.
   */
  private updateIntentionLifespans(): void {
    const now = Date.now();
    
    for (const [intentionId, intention] of this.activeIntentions.entries()) {
      const timeSinceLastDetection = now - intention.lastDetected;
      
      // For intentions that haven't been detected in a while
      if (timeSinceLastDetection > 10 * 60 * 1000) { // 10 minutes
        this.activeIntentions.delete(intentionId);
      } else if (timeSinceLastDetection > 5 * 60 * 1000) { // 5 minutes
        // Decrease confidence for aging intentions
        intention.confidence = Math.max(0.1, intention.confidence * 0.8);
      }
    }
  }
  
  /**
   * Load intentions from context.
   */
  loadFromContext(context: Context): void {
    if (context.userIntentions) {
      for (const intention of context.userIntentions) {
        if (intention.status === 'active') {
          this.activeIntentions.set(intention.id, intention);
        } else {
          this.intentionHistory.push(intention);
        }
      }
    }
  }
  
  /**
   * Get intentions for the current context.
   */
  getIntentionsForContext(): UserIntention[] {
    return this.getActiveIntentions();
  }
  
  /**
   * Reset the intention recognizer.
   */
  reset(): void {
    this.activeIntentions.clear();
    this.intentionHistory = [];
  }
}
