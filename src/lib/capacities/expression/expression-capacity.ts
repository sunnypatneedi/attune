import { 
  EngagementResponse, 
  Context, 
  StyledResponse, 
  StylePreference,
  ReflectionInsight,
  ExpressionOutput
} from '../../types';
import { ResponseStyleManager } from './response-style-manager';

/**
 * ExpressionCapacity manages how the system communicates with users.
 * It handles styling responses, adapting to user preferences, and
 * ensuring clear and effective communication.
 */
export class ExpressionCapacity {
  private styleManager: ResponseStyleManager;
  
  constructor() {
    this.styleManager = new ResponseStyleManager();
  }
  
  /**
   * Apply appropriate expression styling to a response.
   */
  expressResponse(content: string, context: Context): ExpressionOutput {
    // Apply styling based on context and preferences
    const styledResponse = this.styleManager.applyStyle(content, context);
    
    // Build engagement response
    const response: EngagementResponse = {
      response: styledResponse,
      timestamp: Date.now(),
      metadata: {
        processingTime: 0, // Will be set by the caller
        contextSize: this.calculateContextSize(context)
      }
    };
    
    return {
      engagementResponse: response,
      appliedStyle: styledResponse.appliedStyle
    };
  }
  
  /**
   * Set user style preferences.
   */
  setStylePreferences(preferences: StylePreference): void {
    this.styleManager.setUserPreferences(preferences);
  }
  
  /**
   * Get current style preferences.
   */
  getStylePreferences(): StylePreference | null {
    return this.styleManager.getUserPreferences();
  }
  
  /**
   * Reset style to defaults.
   */
  resetStyle(): void {
    this.styleManager.resetStyle();
  }
  
  /**
   * Evolve the capacity based on insights from reflection.
   */
  evolve(insight: ReflectionInsight): void {
    if (insight.targetCapacity !== 'expression') {
      return;
    }
    
    // Apply insights to improve expression
    if (insight.insightType === 'improvement' && insight.description) {
      // Handle specific improvements based on reflection insights
      if (insight.description.includes('style') && insight.suggestedAction) {
        // Update style preferences based on suggestion
        const stylePreferences = insight.suggestedAction.stylePreferences;
        if (stylePreferences) {
          this.setStylePreferences(stylePreferences);
        }
      }
    }
  }
  
  /**
   * Calculate the size/complexity of the current context.
   */
  private calculateContextSize(context: Context): number {
    let size = 0;
    
    // Count entities
    if (context.entities) {
      size += context.entities.length;
    }
    
    // Count intentions
    if (context.userIntentions) {
      size += context.userIntentions.length;
    }
    
    // Count recent messages
    if (context.recentMessages) {
      size += context.recentMessages.length;
    }
    
    // Add other context factors
    if (context.conversationState) {
      size += context.conversationState.activeTopics.length;
    }
    
    return size;
  }
}
