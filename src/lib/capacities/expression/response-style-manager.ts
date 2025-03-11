import { 
  StylePreference, 
  StyledResponse, 
  ResponseStyle, 
  Context,
  UserIntention
} from '../../types';

/**
 * ResponseStyleManager handles adapting the conversational style
 * to match user preferences and contextual needs.
 */
export class ResponseStyleManager {
  private defaultStyle: ResponseStyle = {
    tone: 'neutral',
    formality: 'moderate',
    verbosity: 'balanced',
    empathy: 'moderate'
  };
  
  private userPreferences: StylePreference | null = null;
  
  /**
   * Set user style preferences.
   */
  setUserPreferences(preferences: StylePreference): void {
    this.userPreferences = preferences;
  }
  
  /**
   * Get user style preferences.
   */
  getUserPreferences(): StylePreference | null {
    return this.userPreferences;
  }
  
  /**
   * Reset to default style.
   */
  resetStyle(): void {
    this.userPreferences = null;
  }
  
  /**
   * Apply style to a response based on the current context.
   */
  applyStyle(content: string, context: Context): StyledResponse {
    // Determine appropriate style for this context
    const style = this.determineAppropriateStyle(context);
    
    // Apply the style transformations to the content
    const styledContent = this.transformContent(content, style);
    
    return {
      content: styledContent,
      appliedStyle: style
    };
  }
  
  /**
   * Determine the appropriate style based on context and preferences.
   */
  private determineAppropriateStyle(context: Context): ResponseStyle {
    // Start with default style
    const style: ResponseStyle = { ...this.defaultStyle };
    
    // Apply user preferences if available
    if (this.userPreferences) {
      style.tone = this.userPreferences.preferredTone || style.tone;
      style.formality = this.userPreferences.preferredFormality || style.formality;
      style.verbosity = this.userPreferences.preferredVerbosity || style.verbosity;
      style.empathy = this.userPreferences.preferredEmpathy || style.empathy;
    }
    
    // Adjust based on conversation context
    if (context.conversationState) {
      // Adjust empathy based on sentiment
      if (context.conversationState.recentSentiment < -0.3) {
        // Increase empathy for negative sentiment
        style.empathy = this.increaseLevel(style.empathy);
      }
    }
    
    // Adjust based on user intention
    if (context.userIntentions && context.userIntentions.length > 0) {
      this.adjustStyleForIntention(style, context.userIntentions[0]);
    }
    
    return style;
  }
  
  /**
   * Adjust style based on user intention.
   */
  private adjustStyleForIntention(style: ResponseStyle, intention: UserIntention): void {
    switch (intention.type) {
      case 'information_request':
        // More neutral, balanced for information
        style.tone = 'neutral';
        style.verbosity = 'balanced';
        break;
        
      case 'emotional_support':
        // More warm and empathetic
        style.tone = 'warm';
        style.empathy = 'high';
        break;
        
      case 'task_request':
        // More concise and clear
        style.verbosity = 'concise';
        break;
        
      case 'problem_solving':
        // More detailed for complex problems
        style.verbosity = 'detailed';
        break;
        
      case 'small_talk':
        // More casual and warm
        style.formality = 'casual';
        style.tone = 'warm';
        break;
    }
  }
  
  /**
   * Transform content based on the selected style.
   */
  private transformContent(content: string, style: ResponseStyle): string {
    let result = content;
    
    // Apply tone transformations
    result = this.applyTone(result, style.tone);
    
    // Apply formality transformations
    result = this.applyFormality(result, style.formality);
    
    // Apply verbosity transformations
    result = this.applyVerbosity(result, style.verbosity);
    
    // Apply empathy transformations
    result = this.applyEmpathy(result, style.empathy);
    
    return result;
  }
  
  /**
   * Apply tone styling to content.
   */
  private applyTone(content: string, tone: string): string {
    switch (tone) {
      case 'warm':
        return this.makeWarm(content);
      case 'neutral':
        return this.makeNeutral(content);
      case 'formal':
        return this.makeFormal(content);
      default:
        return content;
    }
  }
  
  /**
   * Apply formality styling to content.
   */
  private applyFormality(content: string, formality: string): string {
    switch (formality) {
      case 'casual':
        return this.makeCasual(content);
      case 'moderate':
        return this.makeModerateFormality(content);
      case 'formal':
        return this.makeFormalFormality(content);
      default:
        return content;
    }
  }
  
  /**
   * Apply verbosity styling to content.
   */
  private applyVerbosity(content: string, verbosity: string): string {
    switch (verbosity) {
      case 'concise':
        return this.makeConcise(content);
      case 'balanced':
        return this.makeBalancedVerbosity(content);
      case 'detailed':
        return this.makeDetailed(content);
      default:
        return content;
    }
  }
  
  /**
   * Apply empathy styling to content.
   */
  private applyEmpathy(content: string, empathy: string): string {
    switch (empathy) {
      case 'low':
        return this.makeLowEmpathy(content);
      case 'moderate':
        return this.makeModerateEmpathy(content);
      case 'high':
        return this.makeHighEmpathy(content);
      default:
        return content;
    }
  }
  
  /**
   * Make content warmer in tone.
   */
  private makeWarm(content: string): string {
    // Replace neutral phrases with warmer alternatives
    return content
      .replace(/I think/g, 'I believe')
      .replace(/It seems/g, 'I feel')
      .replace(/It appears/g, 'I sense')
      .replace(/In conclusion/g, 'All in all')
      .replace(/You should consider/g, 'You might enjoy')
      .replace(/You may want to/g, 'You might love to');
  }
  
  /**
   * Make content neutral in tone.
   */
  private makeNeutral(content: string): string {
    return content
      .replace(/I believe/g, 'I think')
      .replace(/I feel/g, 'It seems')
      .replace(/I sense/g, 'It appears')
      .replace(/All in all/g, 'In conclusion')
      .replace(/You might enjoy/g, 'You might consider')
      .replace(/You might love to/g, 'You may want to');
  }
  
  /**
   * Make content formal in tone.
   */
  private makeFormal(content: string): string {
    return content
      .replace(/I think/g, 'I believe')
      .replace(/It seems/g, 'It appears')
      .replace(/maybe/g, 'perhaps')
      .replace(/thanks/g, 'thank you')
      .replace(/sorry/g, 'I apologize')
      .replace(/a lot/g, 'considerably');
  }
  
  /**
   * Make content casual in formality.
   */
  private makeCasual(content: string): string {
    return content
      .replace(/However/g, 'But')
      .replace(/Therefore/g, 'So')
      .replace(/Additionally/g, 'Also')
      .replace(/regarding/g, 'about')
      .replace(/utilize/g, 'use')
      .replace(/assist/g, 'help');
  }
  
  /**
   * Make content moderately formal.
   */
  private makeModerateFormality(content: string): string {
    // This is our baseline, so we don't need to transform much
    return content;
  }
  
  /**
   * Make content more formally.
   */
  private makeFormalFormality(content: string): string {
    return content
      .replace(/But/g, 'However')
      .replace(/So/g, 'Therefore')
      .replace(/Also/g, 'Additionally')
      .replace(/about/g, 'regarding')
      .replace(/use/g, 'utilize')
      .replace(/help/g, 'assist');
  }
  
  /**
   * Make content more concise.
   */
  private makeConcise(content: string): string {
    // Remove filler phrases
    let result = content
      .replace(/In order to/g, 'To')
      .replace(/As a matter of fact/g, '')
      .replace(/It is worth noting that/g, 'Note that')
      .replace(/In the event that/g, 'If')
      .replace(/Due to the fact that/g, 'Because')
      .replace(/,\s*as well as/g, ' and');
    
    // Replace longer sentences with shorter versions (simplified approach)
    const sentences = result.split(/\.\s+/);
    if (sentences.length > 3) {
      // Keep only the most important sentences
      const importantSentences = sentences.filter(s => 
        s.includes('key') || 
        s.includes('important') || 
        s.includes('essential') ||
        s.includes('main')
      );
      
      if (importantSentences.length > 0) {
        result = importantSentences.join('. ') + '.';
      } else {
        // If no "important" sentences, keep the first few
        result = sentences.slice(0, Math.ceil(sentences.length / 2)).join('. ') + '.';
      }
    }
    
    return result;
  }
  
  /**
   * Make content balanced in verbosity.
   */
  private makeBalancedVerbosity(content: string): string {
    // This is our baseline, so we don't need to transform much
    return content;
  }
  
  /**
   * Make content more detailed.
   */
  private makeDetailed(content: string): string {
    // Add more detail by expanding on key points
    // This is a simplistic implementation - in a real system,
    // this would involve more sophisticated NLP
    
    // Check if content is too short for the detailed style
    if (content.split(' ').length < 50) {
      // Add a detail-oriented prefix
      return "Let me provide you with comprehensive information. " + content + 
        " To elaborate further, consider the following additional details...";
    }
    
    return content;
  }
  
  /**
   * Make content show low empathy.
   */
  private makeLowEmpathy(content: string): string {
    // Remove empathetic phrases
    return content
      .replace(/I understand how you feel/g, '')
      .replace(/I can see why that would be frustrating/g, '')
      .replace(/That must be difficult/g, '')
      .replace(/I'm sorry to hear that/g, '');
  }
  
  /**
   * Make content show moderate empathy.
   */
  private makeModerateEmpathy(content: string): string {
    // This is our baseline, so we don't need to transform much
    return content;
  }
  
  /**
   * Make content show high empathy.
   */
  private makeHighEmpathy(content: string): string {
    // If the content doesn't already have empathetic phrases
    if (!content.includes('understand') && 
        !content.includes('appreciate') && 
        !content.includes('sorry to hear')) {
      
      // Add an empathetic opening
      return "I understand how important this is to you. " + content;
    }
    
    return content;
  }
  
  /**
   * Increase the level of a style attribute.
   */
  private increaseLevel(current: string): string {
    switch (current) {
      case 'low':
        return 'moderate';
      case 'moderate':
        return 'high';
      default:
        return current;
    }
  }
  
  /**
   * Decrease the level of a style attribute.
   */
  private decreaseLevel(current: string): string {
    switch (current) {
      case 'high':
        return 'moderate';
      case 'moderate':
        return 'low';
      default:
        return current;
    }
  }
}
