import { eventBus } from './event-bus';
import { EnhancedMessage, Entity, EntityType, Intention, IntentionType, ResponseContext } from './enhanced-types';
import { IntentionDetector } from './understanding/intention-detector';
import { EntityRecognizer } from './understanding/entity-recognizer';
import { WorkingMemory } from './memory/working-memory';
import { InteractionPatternTracker } from './patterns/interaction-pattern-tracker';
import { v4 as uuidv4 } from 'uuid';

/**
 * The EnhancedUnderstandingFramework integrates all understanding components:
 * - Intention detection
 * - Entity recognition
 * - Working memory
 * - Interaction pattern tracking
 * 
 * It processes incoming messages to enhance them with understanding
 * and manages the overall conversation context.
 */
export class EnhancedUnderstandingFramework {
  private intentionDetector: IntentionDetector;
  private entityRecognizer: EntityRecognizer;
  private workingMemory: WorkingMemory;
  private patternTracker: InteractionPatternTracker;
  
  constructor() {
    this.intentionDetector = new IntentionDetector();
    this.entityRecognizer = new EntityRecognizer();
    this.workingMemory = new WorkingMemory();
    this.patternTracker = new InteractionPatternTracker();
    
    this.subscribeToEvents();
  }
  
  /**
   * Subscribe to relevant events on the event bus
   */
  private subscribeToEvents(): void {
    eventBus.subscribe(event => {
      // Process user messages
      if (event.type === 'userMessage' && event.payload?.text) {
        this.processUserMessage(event.payload.text);
      }
      
      // Process system messages
      if (event.type === 'systemMessage' && event.payload?.text) {
        this.processSystemMessage(event.payload.text);
      }
    });
  }
  
  /**
   * Process a user message through the understanding pipeline
   * @param text The raw message text
   * @returns Enhanced message with understanding
   */
  processUserMessage(text: string): EnhancedMessage {
    // Step 1: Detect entities
    const entities = this.entityRecognizer.recognizeEntities(text);
    
    // Step 2: Detect intentions
    const intentions = this.intentionDetector.detectIntentions(text, entities);
    const primaryIntention = this.intentionDetector.identifyPrimaryIntention(intentions);
    
    // Step 3: Create enhanced message
    const enhancedMessage: EnhancedMessage = {
      id: uuidv4(),
      content: text,
      sender: 'user',
      timestamp: Date.now(),
      detectedIntentions: intentions,
      primaryIntention: primaryIntention,
      entities: entities,
      isNew: true
    };
    
    // Step 4: Add message to working memory
    this.workingMemory.addMessage(enhancedMessage);
    
    // Step 5: Track interaction pattern
    this.patternTracker.trackMessage(enhancedMessage);
    
    // Step 6: Emit the enhanced message
    eventBus.next({
      type: 'enhancedUserMessage',
      payload: enhancedMessage
    });
    
    return enhancedMessage;
  }
  
  /**
   * Process a system message
   * @param text The raw message text
   * @returns Enhanced message for the system
   */
  processSystemMessage(text: string): EnhancedMessage {
    // For system messages, we do simpler processing
    
    // Create system intention
    const systemIntention: Intention = {
      type: IntentionType.SYSTEM_INFORM, // Default to inform
      confidence: 1.0
    };
    
    // Detect entities (limited use for system messages)
    const entities = this.entityRecognizer.recognizeEntities(text);
    
    // Create enhanced message
    const enhancedMessage: EnhancedMessage = {
      id: uuidv4(),
      content: text,
      sender: 'system',
      timestamp: Date.now(),
      detectedIntentions: [systemIntention],
      primaryIntention: systemIntention,
      entities: entities,
      isNew: true
    };
    
    // Add to working memory
    this.workingMemory.addMessage(enhancedMessage);
    
    // Emit the enhanced message
    eventBus.next({
      type: 'enhancedSystemMessage',
      payload: enhancedMessage
    });
    
    return enhancedMessage;
  }
  
  /**
   * Generate a response context for the response generator
   * @param userMessage The enhanced user message to respond to
   * @returns Context for response generation
   */
  createResponseContext(userMessage: EnhancedMessage): ResponseContext {
    // Get current conversation context
    const conversationContext = this.workingMemory.getContext();
    
    // Get relevant patterns
    const relevantPatterns = this.patternTracker.getRelevantPatterns(
      userMessage.primaryIntention?.type,
      userMessage.entities?.map(e => e.value)
    );
    
    return {
      userMessage,
      conversationContext,
      detectedPatterns: relevantPatterns
    };
  }
  
  /**
   * Get the current working memory context
   * @returns The current conversation context
   */
  getContext() {
    return this.workingMemory.getContext();
  }
  
  /**
   * Get detected interaction patterns
   * @returns All detected interaction patterns
   */
  getInteractionPatterns() {
    return this.patternTracker.getPatterns();
  }
  
  /**
   * Reset the framework state
   */
  reset(): void {
    this.workingMemory.reset();
    this.patternTracker.resetPatterns();
  }
}
