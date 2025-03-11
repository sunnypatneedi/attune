import { Intention, IntentionType, Entity } from '../enhanced-types';

/**
 * A utility class that analyzes text to detect user intentions.
 * This implementation uses simple rule-based detection, but could be
 * replaced with a more sophisticated ML-based approach in the future.
 */
export class IntentionDetector {
  private intentionPatterns: Map<IntentionType, RegExp[]> = new Map<IntentionType, RegExp[]>();
  private intentionKeywords: Map<IntentionType, string[]> = new Map<IntentionType, string[]>();
  
  constructor() {
    this.initializePatterns();
  }
  
  /**
   * Initialize regex patterns and keywords for intention detection
   */
  private initializePatterns(): void {
    // Set up regex patterns for each intention type
    this.intentionPatterns = new Map<IntentionType, RegExp[]>([
      // Question patterns
      [IntentionType.QUESTION_FACTUAL, [
        /^(what|where|when|who|how|why|which|can you tell me|do you know|tell me about).+\?$/i,
        /^is.+\?$/i,
        /^are.+\?$/i,
        /^(could|would) you (tell|explain|describe|clarify).+\?$/i
      ]],
      [IntentionType.QUESTION_OPINION, [
        /^what (do you think|is your opinion|are your thoughts) (about|on).+\?$/i,
        /^(how|what) do you feel about.+\?$/i,
        /^would you (say|consider|recommend).+\?$/i
      ]],
      [IntentionType.QUESTION_CLARIFICATION, [
        /^(what do you mean|can you clarify|could you explain|i'm not sure i understand|what do you mean by).+\?$/i,
        /^(come again|sorry|excuse me|pardon)\?$/i
      ]],
      
      // Action patterns
      [IntentionType.REQUEST_ACTION, [
        /^(can|could|would) you (please )?(help|assist|do|create|make|find|show|display|calculate).+\?$/i,
        /^(please|kindly) (help|assist|show|find|create).+$/i,
        /^i (need|want|would like) (you to|for you to|help with|assistance with).+$/i
      ]],
      [IntentionType.COMMAND, [
        /^(help|assist|do|create|make|find|show|display|calculate|clear|delete|remove|change|switch|toggle|set|turn).+$/i
      ]],
      
      // Social patterns
      [IntentionType.GREETING, [
        /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|howdy).+$/i
      ]],
      [IntentionType.FAREWELL, [
        /^(bye|goodbye|see you|talk to you later|until next time|have a good day|good night).+$/i
      ]],
      [IntentionType.GRATITUDE, [
        /^(thank you|thanks|much appreciated|grateful|appreciate it).+$/i
      ]],
      [IntentionType.APOLOGY, [
        /^(sorry|i apologize|my apologies|forgive me|excuse me).+$/i
      ]],
      [IntentionType.AGREEMENT, [
        /^(yes|yeah|yep|sure|of course|absolutely|definitely|i agree|that's right|correct|indeed).+$/i
      ]],
      [IntentionType.DISAGREEMENT, [
        /^(no|nope|not really|i disagree|that's incorrect|i don't think so|that's wrong).+$/i
      ]],
      
      // Emotional patterns
      [IntentionType.EXPRESS_POSITIVE, [
        /^(i('m| am) (happy|glad|excited|pleased|delighted)|that's (great|good|wonderful|awesome|amazing)).+$/i,
        /^(love it|fantastic|excellent|perfect|brilliant|outstanding|superb).+$/i
      ]],
      [IntentionType.EXPRESS_NEGATIVE, [
        /^(i('m| am) (sad|upset|angry|frustrated|disappointed|annoyed)|that's (bad|terrible|awful|horrible|disappointing)).+$/i,
        /^(hate it|dislike|terrible|awful|horrible|dreadful|unacceptable).+$/i
      ]],
      
      // Meta-conversational patterns
      [IntentionType.FEEDBACK_POSITIVE, [
        /^(that was helpful|good job|well done|nice work|you're doing great|that's useful).+$/i
      ]],
      [IntentionType.FEEDBACK_NEGATIVE, [
        /^(that (wasn't|was not) helpful|not what i was looking for|you didn't understand|you misunderstood|that's not right).+$/i
      ]],
      [IntentionType.TOPIC_SWITCH, [
        /^(let's talk about|changing the subject|on another note|switching gears|moving on to|speaking of).+$/i
      ]],
      [IntentionType.META_COMMUNICATION, [
        /^(i'm trying to|my goal is to|what i'm looking for is|the reason i'm asking is|to clarify).+$/i
      ]]
    ]);
    
    // Set up keyword lists for each intention type
    this.intentionKeywords = new Map<IntentionType, string[]>([
      [IntentionType.QUESTION_FACTUAL, ['what', 'where', 'when', 'who', 'how', 'why', 'which']],
      [IntentionType.QUESTION_OPINION, ['think', 'opinion', 'feel', 'recommend', 'suggest']],
      [IntentionType.QUESTION_CLARIFICATION, ['clarify', 'explain', 'mean', 'understand', 'confused']],
      [IntentionType.REQUEST_ACTION, ['help', 'assist', 'please', 'need', 'want', 'could you', 'would you', 'can you']],
      [IntentionType.COMMAND, ['search', 'find', 'show', 'display', 'create', 'change', 'update', 'delete', 'clear']],
      [IntentionType.GREETING, ['hi', 'hello', 'hey', 'greetings', 'morning', 'afternoon', 'evening']],
      [IntentionType.FAREWELL, ['bye', 'goodbye', 'see you', 'later', 'night', 'leaving']],
      [IntentionType.GRATITUDE, ['thanks', 'thank', 'appreciate', 'grateful', 'thankful']],
      [IntentionType.APOLOGY, ['sorry', 'apologize', 'apologies', 'forgive', 'mistake']],
      [IntentionType.AGREEMENT, ['yes', 'agree', 'correct', 'right', 'indeed', 'exactly']],
      [IntentionType.DISAGREEMENT, ['no', 'disagree', 'incorrect', 'wrong', 'mistaken', "don't think so"]],
      [IntentionType.EXPRESS_POSITIVE, ['happy', 'glad', 'excited', 'love', 'great', 'good', 'wonderful']],
      [IntentionType.EXPRESS_NEGATIVE, ['sad', 'upset', 'angry', 'hate', 'bad', 'terrible', 'frustrated']],
      [IntentionType.FEEDBACK_POSITIVE, ['helpful', 'good job', 'well done', 'useful', 'perfect']],
      [IntentionType.FEEDBACK_NEGATIVE, ['not helpful', "didn't help", 'misunderstood', 'wrong', 'incorrect']],
      [IntentionType.TOPIC_SWITCH, ['change subject', 'another topic', 'different topic', 'speaking of']],
      [IntentionType.META_COMMUNICATION, ['trying to', 'my goal', 'looking for', 'purpose', 'conversation']]
    ]);
  }
  
  /**
   * Detect all possible intentions in a message
   * @param text The message text to analyze
   * @param entities Optional entities that have been detected in the text
   * @returns Array of detected intentions with confidence scores
   */
  detectIntentions(text: string, entities?: Entity[]): Intention[] {
    const detectedIntentions: Intention[] = [];
    const lowerText = text.toLowerCase().trim();
    
    // First pass: check for pattern matches
    for (const [intentionType, patterns] of this.intentionPatterns.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          // Add this intention with high confidence
          detectedIntentions.push({
            type: intentionType,
            confidence: 0.9, // High confidence for pattern match
            relatedEntities: this.findRelatedEntities(intentionType, entities),
            metadata: { matchedPattern: pattern.toString() }
          });
          
          // Don't break here, allow multiple intentions to be detected
        }
      }
    }
    
    // Second pass: keyword matching for intentions not detected by patterns
    if (detectedIntentions.length === 0 || detectedIntentions[0].confidence < 0.8) {
      for (const [intentionType, keywords] of this.intentionKeywords.entries()) {
        // Skip if we already detected this intention type with high confidence
        if (detectedIntentions.some(i => i.type === intentionType && i.confidence >= 0.8)) {
          continue;
        }
        
        // Count how many keywords are present
        const matches = keywords.filter(keyword => {
          // Check for whole word matches
          const regex = new RegExp(`\\b${keyword}\\b`, 'i');
          return regex.test(lowerText);
        });
        
        if (matches.length > 0) {
          // Calculate confidence based on number of keyword matches
          const confidence = Math.min(0.3 + (matches.length * 0.2), 0.85);
          
          detectedIntentions.push({
            type: intentionType,
            confidence,
            relatedEntities: this.findRelatedEntities(intentionType, entities),
            metadata: { matchedKeywords: matches }
          });
        }
      }
    }
    
    // Special handling for questions (check for question mark)
    if (text.endsWith('?') && !detectedIntentions.some(i => 
        i.type === IntentionType.QUESTION_FACTUAL || 
        i.type === IntentionType.QUESTION_OPINION || 
        i.type === IntentionType.QUESTION_CLARIFICATION)) {
      
      detectedIntentions.push({
        type: IntentionType.QUESTION_FACTUAL,
        confidence: 0.7, // Medium-high confidence just based on question mark
        relatedEntities: entities,
      });
    }
    
    // Add fallback unknown intention if nothing was detected
    if (detectedIntentions.length === 0) {
      detectedIntentions.push({
        type: IntentionType.UNKNOWN,
        confidence: 1.0, // High confidence that we don't know!
        relatedEntities: entities,
      });
    }
    
    // Sort intentions by confidence (highest first)
    return detectedIntentions.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * Identifies the primary intention from multiple detected intentions
   * @param intentions Array of detected intentions
   * @returns The primary intention
   */
  identifyPrimaryIntention(intentions: Intention[]): Intention {
    if (intentions.length === 0) {
      // Return unknown intention if none detected
      return {
        type: IntentionType.UNKNOWN,
        confidence: 1.0
      };
    }
    
    // Start with the highest confidence intention
    let primary = intentions[0];
    
    // Some intentions override others regardless of confidence
    for (const intention of intentions) {
      // Commands and requests tend to be more important than other intentions
      if ((intention.type === IntentionType.COMMAND || 
           intention.type === IntentionType.REQUEST_ACTION) && 
          intention.confidence > 0.7 &&
          primary.type !== IntentionType.COMMAND &&
          primary.type !== IntentionType.REQUEST_ACTION) {
        primary = intention;
      }
      
      // Questions also tend to be important
      if ((intention.type === IntentionType.QUESTION_FACTUAL ||
           intention.type === IntentionType.QUESTION_OPINION ||
           intention.type === IntentionType.QUESTION_CLARIFICATION) &&
          intention.confidence > 0.8 &&
          primary.type !== IntentionType.COMMAND &&
          primary.type !== IntentionType.REQUEST_ACTION &&
          !primary.type.startsWith('question_')) {
        primary = intention;
      }
    }
    
    return primary;
  }
  
  /**
   * Find entities related to a specific intention type
   * @param intentionType The type of intention
   * @param entities List of all detected entities
   * @returns Array of entities related to this intention
   */
  private findRelatedEntities(intentionType: IntentionType, entities?: Entity[]): Entity[] | undefined {
    if (!entities || entities.length === 0) {
      return undefined;
    }
    
    // For now, return all entities as related
    // In a more sophisticated implementation, we would filter based on relevance
    return entities;
  }
}
