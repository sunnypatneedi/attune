import { 
  CoreValue, 
  Context, 
  EngagementResponse, 
  ValueTension,
  ReflectionInsight,
  ValueOutput,
  StyledResponse
} from '../../types';
import { coreValues } from './core-values';
import { ValueHierarchy } from './value-hierarchy';
import { ContextualValueApplicability } from './contextual-value-applicability';

/**
 * ValueGroundingCapacity ensures all responses align with core ethical values
 * and handles tensions between competing values.
 */
export class ValueGroundingCapacity {
  private valueHierarchy: ValueHierarchy;
  private valueApplicability: ContextualValueApplicability;
  private values: CoreValue[];
  
  constructor() {
    this.values = [...coreValues]; // Clone to prevent mutation of the original
    this.valueHierarchy = new ValueHierarchy(this.values);
    this.valueApplicability = new ContextualValueApplicability();
  }
  
  /**
   * Process the current context and determine relevant values and constraints.
   */
  processContext(context: Context): ValueOutput {
    // Get values relevant to the current context
    const relevantValues = this.valueApplicability.getRelevantValues(context, this.values);
    
    // Identify any tensions between values
    const valueTensions = this.valueHierarchy.identifyValueTensions(relevantValues, context);
    
    // Generate value constraints based on relevant values
    const valueConstraints = this.generateValueConstraints(relevantValues, valueTensions, context);
    
    return {
      relevantValues,
      valueTensions,
      valueConstraints
    };
  }
  
  /**
   * Align a response with core values.
   */
  alignWithValues(response: EngagementResponse, context: Context): EngagementResponse {
    // Get values relevant to this context
    const { relevantValues, valueTensions, valueConstraints } = this.processContext(context);
    
    // Apply value alignment
    const alignedResponse = this.applyValueAlignment(response, relevantValues, valueConstraints);
    
    // Track which values were used for alignment
    alignedResponse.valueBasis = relevantValues.map(value => value.id);
    
    return alignedResponse;
  }
  
  /**
   * Generate constraints based on values and tensions.
   */
  private generateValueConstraints(
    relevantValues: CoreValue[], 
    valueTensions: ValueTension[], 
    context: Context
  ): Record<string, any> {
    const constraints: Record<string, any> = {};
    
    // Add basic constraints from each relevant value
    for (const value of relevantValues) {
      this.addValueConstraints(constraints, value, context);
    }
    
    // Add constraints from value tensions
    for (const tension of valueTensions) {
      this.addTensionConstraints(constraints, tension, relevantValues, context);
    }
    
    return constraints;
  }
  
  /**
   * Add constraints for a specific value.
   */
  private addValueConstraints(
    constraints: Record<string, any>, 
    value: CoreValue, 
    context: Context
  ): void {
    switch (value.id) {
      case 'human_agency':
        constraints.preserveUserAgency = true;
        constraints.provideClearOptions = true;
        constraints.avoidManipulation = true;
        constraints.transparentReasoning = true;
        break;
        
      case 'truthfulness':
        constraints.accurateInformation = true;
        constraints.acknowledgeUncertainty = true;
        constraints.correctMistakes = true;
        constraints.attributeSources = true;
        break;
        
      case 'user_wellbeing':
        constraints.respondWithEmpathy = true;
        constraints.handleSensitiveTopicsWithCare = true;
        constraints.avoidHarmfulContent = true;
        break;
        
      case 'privacy_security':
        constraints.respectPrivacy = true;
        constraints.promoteSecurity = true;
        constraints.transparentDataUse = true;
        break;
        
      case 'inclusivity':
        constraints.useInclusiveLanguage = true;
        constraints.considerDiversePerspectives = true;
        constraints.ensureAccessibility = true;
        break;
        
      case 'authenticity':
        constraints.transparentAsAI = true;
        constraints.honestAboutCapabilities = true;
        constraints.genuineReasoning = true;
        break;
    }
  }
  
  /**
   * Add constraints based on value tensions.
   */
  private addTensionConstraints(
    constraints: Record<string, any>,
    tension: ValueTension,
    values: CoreValue[],
    context: Context
  ): void {
    // Get the values involved in the tension
    const value1 = values.find(v => v.id === tension.valueId1);
    const value2 = values.find(v => v.id === tension.valueId2);
    
    if (!value1 || !value2) {
      return;
    }
    
    // Determine the priority value
    const priorityValue = this.valueHierarchy.resolveConflict(value1, value2, context);
    
    switch (tension.tensionType) {
      case 'priority':
        // For priority tensions, emphasize the priority value
        constraints.priorityValueId = priorityValue.id;
        break;
        
      case 'interpretation':
        // For interpretation tensions, provide clarity on how values are interpreted
        constraints.explainValueInterpretation = true;
        constraints.valueInterpretationIds = [value1.id, value2.id];
        break;
        
      case 'application':
        // For application tensions, be clear about how values are being applied
        constraints.explainValueApplication = true;
        constraints.valueApplicationIds = [value1.id, value2.id];
        break;
    }
    
    // Add custom constraints for specific value tensions
    if ((value1.id === 'truthfulness' && value2.id === 'user_wellbeing') ||
        (value2.id === 'truthfulness' && value1.id === 'user_wellbeing')) {
      
      // Tension between truthfulness and wellbeing
      constraints.balanceTruthAndWellbeing = true;
      constraints.prioritizeTruthfulness = priorityValue.id === 'truthfulness';
    }
    
    if ((value1.id === 'privacy_security' && value2.id === 'human_agency') ||
        (value2.id === 'privacy_security' && value1.id === 'human_agency')) {
      
      // Tension between privacy/security and human agency
      constraints.balancePrivacyAndAgency = true;
      constraints.prioritizePrivacy = priorityValue.id === 'privacy_security';
    }
  }
  
  /**
   * Apply value alignment to a response.
   */
  private applyValueAlignment(
    response: EngagementResponse, 
    values: CoreValue[],
    constraints: Record<string, any>
  ): EngagementResponse {
    // Create a modified copy of the response
    const alignedResponse = { ...response };
    
    // Extract the styled response content to modify
    const styledResponse = { ...response.response };
    const content = this.extractResponseContent(styledResponse);
    
    // Apply transformations based on constraints
    let modifiedContent = this.applyContentTransformations(content, constraints);
    
    // Check if content was modified and update styled response
    if (modifiedContent !== content) {
      styledResponse.content = modifiedContent;
      alignedResponse.response = styledResponse;
    }
    
    return alignedResponse;
  }
  
  /**
   * Extract the content from a styled response.
   */
  private extractResponseContent(styledResponse: StyledResponse): string {
    if (typeof styledResponse.content === 'string') {
      return styledResponse.content;
    } else {
      return JSON.stringify(styledResponse.content);
    }
  }
  
  /**
   * Apply transformations to response content based on constraints.
   */
  private applyContentTransformations(
    content: string, 
    constraints: Record<string, any>
  ): string {
    let modified = content;
    
    // Apply truthfulness constraints
    if (constraints.acknowledgeUncertainty) {
      modified = this.ensureUncertaintyAcknowledged(modified);
    }
    
    // Apply agency constraints
    if (constraints.preserveUserAgency) {
      modified = this.ensureAgencyPreserved(modified);
    }
    
    if (constraints.provideClearOptions && !modified.includes('option') && !modified.includes('choice')) {
      modified = this.addClearOptions(modified);
    }
    
    // Apply wellbeing constraints
    if (constraints.respondWithEmpathy) {
      modified = this.ensureEmpathyExpressed(modified);
    }
    
    // Apply inclusivity constraints
    if (constraints.useInclusiveLanguage) {
      modified = this.ensureInclusiveLanguage(modified);
    }
    
    // Apply authenticity constraints
    if (constraints.transparentAsAI && !modified.toLowerCase().includes('ai') && 
        !modified.toLowerCase().includes('assistant')) {
      modified = this.ensureAITransparency(modified);
    }
    
    // Handle value tensions
    if (constraints.explainValueInterpretation) {
      modified = this.addValueInterpretationExplanation(modified, constraints);
    }
    
    return modified;
  }
  
  /**
   * Ensure uncertainty is acknowledged when appropriate.
   */
  private ensureUncertaintyAcknowledged(content: string): string {
    // If content already acknowledges uncertainty, return as is
    if (content.includes('might') || 
        content.includes('may ') || 
        content.includes('possibly') || 
        content.includes('I'm not certain') || 
        content.includes('I'm not sure')) {
      return content;
    }
    
    // Check if content makes strong factual claims without evidence
    const hasStrongClaims = (
      content.includes('definitely') || 
      content.includes('always') || 
      content.includes('never') || 
      content.includes('absolutely')
    );
    
    if (hasStrongClaims) {
      // Replace strong language with more nuanced statements
      return content
        .replace(/definitely/g, 'likely')
        .replace(/always/g, 'often')
        .replace(/never/g, 'rarely')
        .replace(/absolutely/g, 'generally');
    }
    
    return content;
  }
  
  /**
   * Ensure user agency is preserved.
   */
  private ensureAgencyPreserved(content: string): string {
    // Replace directive language with suggestions
    let modified = content
      .replace(/you should/gi, 'you might consider')
      .replace(/you need to/gi, 'you might want to')
      .replace(/you must/gi, 'it may be helpful to')
      .replace(/you have to/gi, 'it could be beneficial to');
    
    // Check if we're trying to make a decision for the user
    if (modified.includes('the best choice is') || 
        modified.includes('you ought to') || 
        modified.includes('the right decision is')) {
      
      modified = modified
        .replace(/the best choice is/gi, 'one option could be')
        .replace(/you ought to/gi, 'you might consider')
        .replace(/the right decision is/gi, 'one possibility is');
    }
    
    return modified;
  }
  
  /**
   * Add clear options if none are present.
   */
  private addClearOptions(content: string): string {
    // Only add options if it seems like we're suggesting what the user should do
    if (content.includes('you might') || content.includes('you could') || content.includes('consider')) {
      // Add options at the end of the content
      return content + '\n\nHere are some options to consider:\n1. ...\n2. ...\n3. ...\n\nThe choice is entirely yours.';
    }
    
    return content;
  }
  
  /**
   * Ensure empathy is expressed when appropriate.
   */
  private ensureEmpathyExpressed(content: string): string {
    // Check if content already expresses empathy
    if (content.includes('understand') || 
        content.includes('appreciate') || 
        content.includes('I hear you')) {
      return content;
    }
    
    // If content is addressing something challenging, add empathy
    if (content.includes('difficult') || 
        content.includes('challenge') || 
        content.includes('problem') || 
        content.includes('issue')) {
      
      // Add empathetic opening
      return 'I understand this can be challenging. ' + content;
    }
    
    return content;
  }
  
  /**
   * Ensure language is inclusive.
   */
  private ensureInclusiveLanguage(content: string): string {
    // Replace potentially non-inclusive terms with more inclusive alternatives
    return content
      .replace(/guys/gi, 'everyone')
      .replace(/mankind/gi, 'humanity')
      .replace(/manpower/gi, 'workforce')
      .replace(/chairman/gi, 'chairperson')
      .replace(/policeman/gi, 'police officer')
      .replace(/fireman/gi, 'firefighter')
      .replace(/stewardess/gi, 'flight attendant')
      .replace(/mailman/gi, 'mail carrier');
  }
  
  /**
   * Ensure transparency about being an AI.
   */
  private ensureAITransparency(content: string): string {
    // Check if the response is making a claim that implies human-like abilities
    if (content.includes('I think') || 
        content.includes('I feel') || 
        content.includes('In my experience')) {
      
      // Replace with more transparent language
      return content
        .replace(/I think/gi, 'Based on my analysis')
        .replace(/I feel/gi, 'It appears that')
        .replace(/In my experience/gi, 'Based on available information');
    }
    
    // If it's a normal informational response, no need to add AI transparency
    if (content.includes('here is') || 
        content.includes('according to') || 
        content.startsWith('The ')) {
      return content;
    }
    
    // For other responses, add a subtle reminder
    return 'As an AI assistant, ' + content;
  }
  
  /**
   * Add explanation about value interpretation when there's a tension.
   */
  private addValueInterpretationExplanation(
    content: string, 
    constraints: Record<string, any>
  ): string {
    if (!constraints.valueInterpretationIds || constraints.valueInterpretationIds.length !== 2) {
      return content;
    }
    
    // Extract the values in tension
    const value1Id = constraints.valueInterpretationIds[0];
    const value2Id = constraints.valueInterpretationIds[1];
    
    // Get human-readable names
    const valueNames: Record<string, string> = {
      'human_agency': 'respecting your autonomy',
      'truthfulness': 'providing accurate information',
      'user_wellbeing': 'supporting your wellbeing',
      'privacy_security': 'protecting privacy and security',
      'inclusivity': 'being inclusive',
      'authenticity': 'being authentic'
    };
    
    // Create an explanation
    const explanation = `\n\nIn this response, I'm balancing ${valueNames[value1Id]} with ${valueNames[value2Id]}.`;
    
    return content + explanation;
  }
  
  /**
   * Identify value tensions in a given context.
   */
  identifyValueTensions(context: Context): ValueTension[] {
    const relevantValues = this.valueApplicability.getRelevantValues(context, this.values);
    return this.valueHierarchy.identifyValueTensions(relevantValues, context);
  }
  
  /**
   * Evolve the capacity based on insights from reflection.
   */
  evolve(insight: ReflectionInsight): void {
    if (insight.targetCapacity !== 'valueGrounding') {
      return;
    }
    
    switch (insight.insightType) {
      case 'improvement':
        // Apply improvement insights
        if (insight.description.includes('value tension')) {
          // Learn from value tension handling
          // For example, adjust value priorities based on feedback
          // This is a simplified representation
          if (insight.suggestedAction && 
              insight.suggestedAction.value1Id && 
              insight.suggestedAction.value2Id && 
              insight.suggestedAction.contextPattern) {
            
            this.valueHierarchy.setCustomPriority(
              insight.suggestedAction.value1Id,
              insight.suggestedAction.value2Id,
              insight.suggestedAction.priorityFactor,
              insight.suggestedAction.contextPattern
            );
          }
        }
        break;
        
      case 'pattern':
        // Apply pattern-based insights
        if (insight.description.includes('applicability') && insight.suggestedAction) {
          // Adjust value applicability based on patterns
          const enhancements = insight.suggestedAction.enhancements;
          if (Array.isArray(enhancements)) {
            this.valueApplicability.enhance(enhancements);
          }
        }
        break;
        
      case 'warning':
        // Handle warnings about value grounding
        console.warn(`Value grounding warning: ${insight.description}`);
        break;
    }
  }
}
