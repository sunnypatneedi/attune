import { 
  Interaction, 
  AttentionFocus, 
  ReflectionInsight,
  PresenceOutput,
  Context,
  FocusTarget
} from '../../types';
import { AttentionManager } from './attention-manager';
import { ContextMemoryManager } from './context-memory-manager';

/**
 * PresenceCapacity coordinates attention management and context memory
 * to ensure the system is fully present and attentive during interactions.
 */
export class PresenceCapacity {
  private attentionManager: AttentionManager;
  private contextMemoryManager: ContextMemoryManager;
  
  constructor() {
    this.attentionManager = new AttentionManager();
    this.contextMemoryManager = new ContextMemoryManager();
  }
  
  /**
   * Engage with an interaction, focusing attention and updating context memory.
   */
  engage(interaction: Interaction, context: Context): PresenceOutput {
    // Update attention focus based on the interaction
    const currentFocus = this.attentionManager.getCurrentFocus();
    const updatedFocus = this.attentionManager.updateFocus(currentFocus, interaction, context);
    
    // Extract contextual clues from the focus points
    const contextualClues = this.extractContextualClues(updatedFocus, context);
    
    // Register the interaction in context memory
    this.contextMemoryManager.registerInteraction(interaction, context);
    
    // Retrieve relevant context for the current interaction
    const relevantContext = this.contextMemoryManager.retrieveRelevantContext(
      interaction, 
      contextualClues
    );
    
    // Return presence output
    return {
      focus: updatedFocus,
      relevantContext
    };
  }
  
  /**
   * Extract contextual clues from focus points.
   */
  private extractContextualClues(focus: AttentionFocus, context: Context): string[] {
    const clues: string[] = [];
    
    // Extract clues from primary focus
    if (focus.primaryFocus) {
      // Find the corresponding entity, intention, or topic
      const primaryId = focus.primaryFocus;
      
      // Check if it's an entity
      const entity = context.entities.find(e => e.id === primaryId);
      if (entity) {
        clues.push(entity.name);
        Object.values(entity.attributes).forEach(value => {
          if (typeof value === 'string') {
            clues.push(value);
          }
        });
      }
      
      // Check if it's an intention
      const intention = context.userIntentions.find(i => i.id === primaryId);
      if (intention) {
        clues.push(intention.type);
      }
      
      // Check if it's a topic
      if (primaryId.startsWith('topic_')) {
        clues.push(primaryId.substring(6)); // Remove 'topic_' prefix
      }
    }
    
    // Extract clues from secondary foci
    focus.secondaryFoci.forEach(focusId => {
      // Find the corresponding entity, intention, or topic
      // Check if it's an entity
      const entity = context.entities.find(e => e.id === focusId);
      if (entity) {
        clues.push(entity.name);
      }
      
      // Check if it's an intention
      const intention = context.userIntentions.find(i => i.id === focusId);
      if (intention) {
        clues.push(intention.type);
      }
      
      // Check if it's a topic
      if (focusId.startsWith('topic_')) {
        clues.push(focusId.substring(6)); // Remove 'topic_' prefix
      }
    });
    
    return clues;
  }
  
  /**
   * Get the current focus of attention.
   */
  getCurrentFocus(): AttentionFocus {
    return this.attentionManager.getCurrentFocus();
  }
  
  /**
   * Explicitly focus on a specific target.
   */
  focusOn(target: FocusTarget): void {
    this.attentionManager.focusOn(target);
  }
  
  /**
   * Reset attentional focus.
   */
  resetFocus(): void {
    this.attentionManager.resetAttentionalFilters();
  }
  
  /**
   * Evolve the capacity based on insights from reflection.
   */
  evolve(insight: ReflectionInsight): void {
    // Apply insights to improve attention management
    if (insight.targetCapacity === 'presence') {
      if (insight.insightType === 'improvement') {
        // Adjust attention parameters based on improvement insights
        this.attentionManager.adjustParameters({
          attentionThreshold: Math.min(0.9, Math.max(0.1, Math.random() * 0.2 + 0.4)),
          decayRate: Math.min(0.2, Math.max(0.05, Math.random() * 0.05 + 0.1)),
          maxSecondaryFoci: Math.floor(Math.random() * 2) + 3 // Between 3 and 4
        });
      } else if (insight.insightType === 'pattern') {
        // Apply pattern-based insights
        if (insight.description.includes('distraction')) {
          this.attentionManager.adjustParameters({
            decayRate: 0.05, // Lower decay rate to maintain focus longer
          });
        } else if (insight.description.includes('focus')) {
          this.attentionManager.adjustParameters({
            attentionThreshold: 0.6, // Higher threshold for more selective focus
          });
        }
      }
    }
  }
  
  /**
   * Clean up old, irrelevant context.
   */
  cleanupOldContext(retentionPeriodMs: number = 30 * 60 * 1000): void {
    this.contextMemoryManager.forgetIrrelevantContext(retentionPeriodMs);
  }
}
