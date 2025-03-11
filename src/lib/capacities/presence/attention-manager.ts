import { 
  AttentionFocus, 
  FocusTarget, 
  Interaction, 
  FocusParameters,
  Context
} from '../../types';

/**
 * AttentionManager handles the system's focus during interactions,
 * ensuring it remains attentive to what matters most to the user.
 */
export class AttentionManager {
  private currentFocus: AttentionFocus;
  private parameters: FocusParameters;
  
  constructor() {
    this.currentFocus = {
      primaryFocus: '',
      secondaryFoci: [],
      distractionLevel: 0
    };
    
    this.parameters = {
      attentionThreshold: 0.5,
      decayRate: 0.1,
      maxSecondaryFoci: 3
    };
  }
  
  /**
   * Reset attentional filters to default state.
   */
  resetAttentionalFilters(): void {
    this.currentFocus = {
      primaryFocus: '',
      secondaryFoci: [],
      distractionLevel: 0
    };
  }
  
  /**
   * Focus on a specific target.
   */
  focusOn(target: FocusTarget): void {
    // If already a secondary focus, promote to primary
    if (this.currentFocus.secondaryFoci.includes(target.id)) {
      this.currentFocus.secondaryFoci = this.currentFocus.secondaryFoci
        .filter(id => id !== target.id);
    }
    
    // If there was a primary focus, demote it to secondary
    if (this.currentFocus.primaryFocus && this.currentFocus.primaryFocus !== target.id) {
      this.currentFocus.secondaryFoci.unshift(this.currentFocus.primaryFocus);
      
      // Trim secondary foci if needed
      if (this.currentFocus.secondaryFoci.length > this.parameters.maxSecondaryFoci) {
        this.currentFocus.secondaryFoci = this.currentFocus.secondaryFoci
          .slice(0, this.parameters.maxSecondaryFoci);
      }
    }
    
    // Set new primary focus
    this.currentFocus.primaryFocus = target.id;
    
    // Reset distraction level when focusing
    this.currentFocus.distractionLevel = Math.max(0, this.currentFocus.distractionLevel - 0.3);
  }
  
  /**
   * Update focus based on current interaction.
   */
  updateFocus(currentFocus: AttentionFocus, interaction: Interaction, context: Context): AttentionFocus {
    const newFocus = { ...currentFocus };
    
    // Analyze the interaction to identify focus targets
    const potentialTargets = this.extractFocusTargets(interaction, context);
    
    // If we have high-priority targets, focus on them
    if (potentialTargets.length > 0) {
      // Sort by priority
      potentialTargets.sort((a, b) => b.priority - a.priority);
      
      // Focus on highest priority target
      const primaryTarget = potentialTargets[0];
      newFocus.primaryFocus = primaryTarget.id;
      
      // Set secondary foci
      newFocus.secondaryFoci = potentialTargets
        .slice(1, this.parameters.maxSecondaryFoci + 1)
        .map(target => target.id);
    } else {
      // Apply attention decay when no new focus points
      newFocus.distractionLevel = Math.min(
        1.0, 
        newFocus.distractionLevel + this.parameters.decayRate
      );
    }
    
    return newFocus;
  }
  
  /**
   * Adjust attention parameters.
   */
  adjustParameters(adjustments: Partial<FocusParameters>): void {
    this.parameters = {
      ...this.parameters,
      ...adjustments
    };
  }
  
  /**
   * Get current focus state.
   */
  getCurrentFocus(): AttentionFocus {
    return { ...this.currentFocus };
  }
  
  /**
   * Extract potential focus targets from an interaction.
   */
  private extractFocusTargets(interaction: Interaction, context: Context): FocusTarget[] {
    const targets: FocusTarget[] = [];
    
    // Extract entities as potential focus targets
    if (context.entities) {
      context.entities.forEach(entity => {
        targets.push({
          type: 'entity',
          id: entity.id,
          priority: this.calculateEntityPriority(entity, interaction)
        });
      });
    }
    
    // Extract intentions as potential focus targets
    if (context.userIntentions) {
      context.userIntentions.forEach(intention => {
        targets.push({
          type: 'intention',
          id: intention.id,
          priority: intention.confidence * 0.8 // Prioritize based on confidence
        });
      });
    }
    
    // Extract topics from conversation state
    if (context.conversationState && context.conversationState.activeTopics) {
      context.conversationState.activeTopics.forEach((topic, index) => {
        targets.push({
          type: 'topic',
          id: `topic_${topic}`,
          // Prioritize more recent topics
          priority: 0.5 - (index * 0.1)
        });
      });
    }
    
    // The current message itself is also a focus target
    targets.push({
      type: 'message',
      id: interaction.messageId,
      priority: 0.7 // High priority for the current message
    });
    
    return targets;
  }
  
  /**
   * Calculate priority for an entity based on relevance to current interaction.
   */
  private calculateEntityPriority(entity: any, interaction: Interaction): number {
    // Base priority
    let priority = 0.5;
    
    // Recent mentions increase priority
    const timeSinceLastSeen = Date.now() - entity.lastSeen;
    const recencyBoost = Math.max(0, 0.3 - (timeSinceLastSeen / (1000 * 60 * 10)) * 0.3);
    priority += recencyBoost;
    
    // Check if entity is mentioned in current interaction
    const interactionData = JSON.stringify(interaction.contextData).toLowerCase();
    if (
      interactionData.includes(entity.name.toLowerCase()) || 
      interactionData.includes(entity.id.toLowerCase())
    ) {
      priority += 0.3;
    }
    
    // Cap priority at 1.0
    return Math.min(1.0, priority);
  }
}
