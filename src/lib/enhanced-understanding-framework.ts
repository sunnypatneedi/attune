import { EnhancedMessage, Entity, Intention, IntentionType, ResponseContext } from './enhanced-types';
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
  }

  /**
   * Process a user message through the understanding pipeline
   */
  processUserMessage(text: string): EnhancedMessage {
    const entities = this.entityRecognizer.recognizeEntities(text);
    const intentions = this.intentionDetector.detectIntentions(text, entities);
    const primaryIntention = this.intentionDetector.identifyPrimaryIntention(intentions);

    const enhancedMessage: EnhancedMessage = {
      id: uuidv4(),
      content: text,
      sender: 'user',
      timestamp: Date.now(),
      detectedIntentions: intentions,
      primaryIntention,
      entities,
      isNew: true,
    };

    this.workingMemory.addMessage(enhancedMessage);
    this.patternTracker.trackMessage(enhancedMessage);

    return enhancedMessage;
  }

  /**
   * Process a system/assistant message
   */
  processSystemMessage(text: string): EnhancedMessage {
    const systemIntention: Intention = {
      type: IntentionType.SYSTEM_INFORM,
      confidence: 1.0,
    };

    const entities = this.entityRecognizer.recognizeEntities(text);

    const enhancedMessage: EnhancedMessage = {
      id: uuidv4(),
      content: text,
      sender: 'system',
      timestamp: Date.now(),
      detectedIntentions: [systemIntention],
      primaryIntention: systemIntention,
      entities,
      isNew: true,
    };

    this.workingMemory.addMessage(enhancedMessage);

    return enhancedMessage;
  }

  /**
   * Generate a response context for the response generator
   */
  createResponseContext(userMessage: EnhancedMessage): ResponseContext {
    const conversationContext = this.workingMemory.getContext();
    const relevantPatterns = this.patternTracker.getRelevantPatterns(
      userMessage.primaryIntention?.type,
      userMessage.entities?.map((e) => e.value)
    );

    return {
      userMessage,
      conversationContext,
      detectedPatterns: relevantPatterns,
    };
  }

  /**
   * Serialize the current understanding context for the AI system prompt
   */
  serializeContext() {
    const context = this.workingMemory.getContext();
    const patterns = this.patternTracker.getPatterns();

    return {
      entities: context.currentFocus.activeEntities.map((e) => ({
        type: e.type,
        value: e.value,
        confidence: e.confidence,
      })),
      intentions: context.currentFocus.recentIntentions.map((i) => ({
        type: i.type,
        confidence: i.confidence,
      })),
      activeTopics: context.currentFocus.activeTopics,
      messageCount: context.conversationState.messageCount,
      dominantSentiment: context.conversationState.dominantSentiment,
      patterns: patterns.map((p) => ({
        type: p.type,
        description: p.description,
        confidence: p.confidence,
      })),
    };
  }

  getContext() {
    return this.workingMemory.getContext();
  }

  getInteractionPatterns() {
    return this.patternTracker.getPatterns();
  }

  reset(): void {
    this.workingMemory.reset();
    this.patternTracker.resetPatterns();
  }
}
