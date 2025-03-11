import { 
  ReflectionInsight, 
  InteractionLog, 
  InteractionPattern,
  UserIntention,
  LogQueryParams
} from '../../types';
import { InteractionLogger } from './interaction-logger';

/**
 * ReflectionEngine analyzes past interactions to identify patterns,
 * generate insights, and suggest improvements.
 */
export class ReflectionEngine {
  private interactionLogger: InteractionLogger;
  private insightHistory: ReflectionInsight[] = [];
  private lastReflectionTime: number = 0;
  private reflectionIntervalMs: number = 24 * 60 * 60 * 1000; // Default: once per day
  
  constructor(interactionLogger: InteractionLogger) {
    this.interactionLogger = interactionLogger;
  }
  
  /**
   * Set the frequency for automatic reflection.
   */
  setReflectionInterval(intervalMs: number): void {
    this.reflectionIntervalMs = intervalMs;
  }
  
  /**
   * Trigger reflection if enough time has passed since the last reflection.
   */
  async triggerReflectionIfDue(): Promise<ReflectionInsight[]> {
    const now = Date.now();
    if (now - this.lastReflectionTime >= this.reflectionIntervalMs) {
      return this.reflect();
    }
    return [];
  }
  
  /**
   * Analyze interactions to generate insights.
   */
  async reflect(): Promise<ReflectionInsight[]> {
    this.lastReflectionTime = Date.now();
    
    // Get logs since last reflection
    const logs = await this.interactionLogger.queryLogs({
      timeStart: this.lastReflectionTime - this.reflectionIntervalMs,
      includeMetadata: true
    });
    
    // Generate insights
    const newInsights: ReflectionInsight[] = [];
    
    // Run pattern analysis
    const patterns = this.identifyPatterns(logs);
    for (const pattern of patterns) {
      const insight = this.generateInsightFromPattern(pattern);
      if (insight) {
        newInsights.push(insight);
        this.insightHistory.push(insight);
      }
    }
    
    // Run performance analysis
    const performanceInsights = await this.analyzePerformance(logs);
    newInsights.push(...performanceInsights);
    this.insightHistory.push(...performanceInsights);
    
    // Run user feedback analysis
    const feedbackInsights = await this.analyzeFeedback(logs);
    newInsights.push(...feedbackInsights);
    this.insightHistory.push(...feedbackInsights);
    
    return newInsights;
  }
  
  /**
   * Identify patterns in user interactions.
   */
  private identifyPatterns(logs: InteractionLog[]): InteractionPattern[] {
    const patterns: InteractionPattern[] = [];
    
    // Extract user messages
    const userMessages = logs.filter(log => log.event.type === 'user_message');
    
    // Extract system responses
    const systemResponses = logs.filter(log => log.event.type === 'system_response');
    
    // Look for repeated user intentions
    const intentions = this.extractUserIntentions(userMessages);
    const intentionFrequency = this.calculateFrequencies(intentions);
    
    // Identify frequent intentions
    for (const [intention, frequency] of Object.entries(intentionFrequency)) {
      if (frequency > 3) { // Threshold for "frequent"
        patterns.push({
          type: 'frequent_intention',
          description: `User frequently expresses ${intention} intention`,
          frequency,
          examples: userMessages
            .filter(log => {
              const message = log.event.message;
              return message && message.content && 
                     typeof message.content === 'string' &&
                     message.content.toLowerCase().includes(intention.toLowerCase());
            })
            .map(log => log.event.message)
            .slice(0, 3) // Limit to 3 examples
        });
      }
    }
    
    // Look for error patterns
    const errors = logs.filter(log => log.event.type === 'error');
    const errorTypes = errors.map(log => log.event.error?.name || 'unknown');
    const errorFrequency = this.calculateFrequencies(errorTypes);
    
    // Identify frequent errors
    for (const [errorType, frequency] of Object.entries(errorFrequency)) {
      if (frequency > 2) { // Threshold for "frequent"
        patterns.push({
          type: 'recurring_error',
          description: `Recurring ${errorType} errors`,
          frequency,
          examples: errors
            .filter(log => log.event.error?.name === errorType)
            .map(log => ({
              name: log.event.error?.name || 'unknown',
              message: log.event.error?.message || '',
              context: log.event.context
            }))
            .slice(0, 3) // Limit to 3 examples
        });
      }
    }
    
    // Look for user feedback patterns
    const feedbackLogs = logs.filter(log => log.event.type === 'user_feedback');
    const feedbackTypes = feedbackLogs.map(log => this.categorizeFeedback(log.event.feedback));
    const feedbackFrequency = this.calculateFrequencies(feedbackTypes);
    
    // Identify frequent feedback
    for (const [feedbackType, frequency] of Object.entries(feedbackFrequency)) {
      if (frequency > 2) { // Threshold for "frequent"
        patterns.push({
          type: 'feedback_pattern',
          description: `Recurring ${feedbackType} feedback`,
          frequency,
          examples: feedbackLogs
            .filter(log => this.categorizeFeedback(log.event.feedback) === feedbackType)
            .map(log => log.event.feedback)
            .slice(0, 3) // Limit to 3 examples
        });
      }
    }
    
    // Look for successful interactions
    const successfulInteractions = this.identifySuccessfulInteractions(logs);
    if (successfulInteractions.length > 0) {
      patterns.push({
        type: 'successful_interaction',
        description: 'Pattern of successful interactions',
        frequency: successfulInteractions.length,
        examples: successfulInteractions.slice(0, 3)
      });
    }
    
    return patterns;
  }
  
  /**
   * Extract user intentions from message logs.
   */
  private extractUserIntentions(userMessages: InteractionLog[]): string[] {
    // In a real implementation, this would use NLP to extract intentions
    // For this demo, we'll use a simple keyword-based approach
    
    const intentions: string[] = [];
    
    for (const log of userMessages) {
      const message = log.event.message;
      if (!message || !message.content || typeof message.content !== 'string') {
        continue;
      }
      
      const content = message.content.toLowerCase();
      
      // Simple keyword matching for common intentions
      if (content.includes('help') || content.includes('how to') || content.includes('how do i')) {
        intentions.push('help_request');
      } else if (content.includes('what is') || content.includes('tell me about')) {
        intentions.push('information_request');
      } else if (content.includes('can you') || content.includes('would you') || content.includes('please')) {
        intentions.push('task_request');
      } else if (content.includes('hello') || content.includes('hi ') || content.includes('hey')) {
        intentions.push('greeting');
      } else if (content.includes('thank')) {
        intentions.push('appreciation');
      } else if (content.includes('opinion') || content.includes('think about')) {
        intentions.push('opinion_request');
      } else {
        intentions.push('other');
      }
    }
    
    return intentions;
  }
  
  /**
   * Calculate the frequency of items in an array.
   */
  private calculateFrequencies<T extends string | number>(items: T[]): Record<string, number> {
    const frequencies: Record<string, number> = {};
    
    for (const item of items) {
      const key = String(item);
      frequencies[key] = (frequencies[key] || 0) + 1;
    }
    
    return frequencies;
  }
  
  /**
   * Categorize feedback into types.
   */
  private categorizeFeedback(feedback: any): string {
    if (!feedback) return 'unknown';
    
    if (feedback.rating) {
      const rating = Number(feedback.rating);
      if (rating >= 4) return 'positive';
      if (rating >= 2) return 'neutral';
      return 'negative';
    }
    
    if (feedback.sentiment) {
      return feedback.sentiment;
    }
    
    if (feedback.text) {
      const text = feedback.text.toLowerCase();
      if (text.includes('good') || text.includes('great') || text.includes('excellent')) {
        return 'positive';
      }
      if (text.includes('bad') || text.includes('poor') || text.includes('terrible')) {
        return 'negative';
      }
    }
    
    return 'uncategorized';
  }
  
  /**
   * Identify successful interaction sequences.
   */
  private identifySuccessfulInteractions(logs: InteractionLog[]): any[] {
    const successfulInteractions: any[] = [];
    
    // Group logs by conversation
    const conversationLogs = this.groupByConversation(logs);
    
    // For each conversation, identify successful sequences
    for (const [conversationId, conversationLogs] of Object.entries(conversationLogs)) {
      // Sort logs by timestamp
      conversationLogs.sort((a, b) => a.event.timestamp - b.event.timestamp);
      
      // Look for positive feedback following system responses
      for (let i = 0; i < conversationLogs.length - 1; i++) {
        const log = conversationLogs[i];
        const nextLog = conversationLogs[i + 1];
        
        if (log.event.type === 'system_response' && 
            nextLog.event.type === 'user_feedback' &&
            this.categorizeFeedback(nextLog.event.feedback) === 'positive') {
          
          // Found a successful interaction
          successfulInteractions.push({
            response: log.event.response,
            feedback: nextLog.event.feedback,
            conversationId
          });
        }
      }
    }
    
    return successfulInteractions;
  }
  
  /**
   * Group logs by conversation ID.
   */
  private groupByConversation(logs: InteractionLog[]): Record<string, InteractionLog[]> {
    const grouped: Record<string, InteractionLog[]> = {};
    
    for (const log of logs) {
      const conversationId = log.event.conversationId;
      if (!conversationId) continue;
      
      if (!grouped[conversationId]) {
        grouped[conversationId] = [];
      }
      
      grouped[conversationId].push(log);
    }
    
    return grouped;
  }
  
  /**
   * Generate an insight from an identified pattern.
   */
  private generateInsightFromPattern(pattern: InteractionPattern): ReflectionInsight | null {
    // Different insights based on pattern type
    switch (pattern.type) {
      case 'frequent_intention':
        return {
          id: `insight_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          timestamp: Date.now(),
          insightType: 'pattern',
          targetCapacity: this.determineTargetCapacity(pattern),
          description: `Users frequently express ${pattern.description}`,
          confidence: Math.min(0.9, 0.5 + (pattern.frequency / 10)),
          suggestedAction: {
            actionType: 'optimize_for_intention',
            intentionType: pattern.description.split(' ')[3] // Extract intention type from description
          }
        };
        
      case 'recurring_error':
        return {
          id: `insight_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          timestamp: Date.now(),
          insightType: 'warning',
          targetCapacity: 'all',
          description: `Recurring errors detected: ${pattern.description}`,
          confidence: Math.min(0.9, 0.6 + (pattern.frequency / 10)),
          suggestedAction: {
            actionType: 'fix_error',
            errorType: pattern.description.split(' ')[1]
          }
        };
        
      case 'feedback_pattern':
        // Only create insights for negative feedback patterns
        if (pattern.description.includes('negative')) {
          return {
            id: `insight_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            timestamp: Date.now(),
            insightType: 'improvement',
            targetCapacity: this.determineTargetCapacity(pattern),
            description: `Users frequently provide negative feedback about responses`,
            confidence: Math.min(0.9, 0.5 + (pattern.frequency / 5)),
            suggestedAction: {
              actionType: 'improve_responses',
              feedbackType: 'negative'
            }
          };
        }
        return null;
        
      case 'successful_interaction':
        return {
          id: `insight_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          timestamp: Date.now(),
          insightType: 'improvement',
          targetCapacity: 'expression',
          description: `Identified patterns of successful interactions that received positive feedback`,
          confidence: Math.min(0.9, 0.5 + (pattern.frequency / 10)),
          suggestedAction: {
            actionType: 'reinforce_pattern',
            examples: pattern.examples
          }
        };
        
      default:
        return null;
    }
  }
  
  /**
   * Determine which capacity should handle an insight.
   */
  private determineTargetCapacity(pattern: InteractionPattern): string {
    // Map pattern types to relevant capacities
    if (pattern.type === 'frequent_intention') {
      return 'contextualUnderstanding';
    }
    
    if (pattern.type === 'feedback_pattern') {
      // Check feedback details to determine capacity
      if (pattern.description.includes('style') || 
          pattern.description.includes('tone') || 
          pattern.description.includes('clarity')) {
        return 'expression';
      }
      
      if (pattern.description.includes('relevance') || 
          pattern.description.includes('understanding')) {
        return 'contextualUnderstanding';
      }
      
      if (pattern.description.includes('ethical') || 
          pattern.description.includes('bias') || 
          pattern.description.includes('fairness')) {
        return 'valueGrounding';
      }
    }
    
    // Default to general growth capacity
    return 'growth';
  }
  
  /**
   * Analyze performance metrics from logs.
   */
  private async analyzePerformance(logs: InteractionLog[]): Promise<ReflectionInsight[]> {
    const insights: ReflectionInsight[] = [];
    
    // Measure response times
    const responseLogs = logs.filter(log => log.event.type === 'system_response');
    if (responseLogs.length === 0) return insights;
    
    const processingTimes = responseLogs
      .map(log => log.event.response?.metadata?.processingTime || 0)
      .filter(time => time > 0);
    
    if (processingTimes.length === 0) return insights;
    
    // Calculate average processing time
    const averageTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
    
    // If average time is high, generate an insight
    if (averageTime > 1000) { // More than 1 second
      insights.push({
        id: `insight_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
        insightType: 'improvement',
        targetCapacity: 'all',
        description: `Average response processing time is high (${Math.round(averageTime)}ms)`,
        confidence: 0.8,
        suggestedAction: {
          actionType: 'optimize_performance',
          metricType: 'response_time',
          currentValue: averageTime
        }
      });
    }
    
    return insights;
  }
  
  /**
   * Analyze user feedback for insights.
   */
  private async analyzeFeedback(logs: InteractionLog[]): Promise<ReflectionInsight[]> {
    const insights: ReflectionInsight[] = [];
    
    // Get feedback logs
    const feedbackLogs = logs.filter(log => log.event.type === 'user_feedback');
    if (feedbackLogs.length === 0) return insights;
    
    // Categorize feedback
    const categories: Record<string, number> = {
      'positive': 0,
      'neutral': 0,
      'negative': 0
    };
    
    for (const log of feedbackLogs) {
      const category = this.categorizeFeedback(log.event.feedback);
      if (category in categories) {
        categories[category]++;
      }
    }
    
    const totalFeedback = feedbackLogs.length;
    
    // Generate insights based on feedback distribution
    if (categories.negative / totalFeedback > 0.3) { // More than 30% negative
      insights.push({
        id: `insight_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
        insightType: 'warning',
        targetCapacity: 'all',
        description: `High proportion of negative feedback (${Math.round(categories.negative / totalFeedback * 100)}%)`,
        confidence: 0.7 + (categories.negative / totalFeedback / 2),
        suggestedAction: {
          actionType: 'address_negative_feedback',
          proportion: categories.negative / totalFeedback
        }
      });
    }
    
    if (categories.positive / totalFeedback > 0.7) { // More than 70% positive
      insights.push({
        id: `insight_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
        insightType: 'pattern',
        targetCapacity: 'all',
        description: `High proportion of positive feedback (${Math.round(categories.positive / totalFeedback * 100)}%)`,
        confidence: 0.7 + (categories.positive / totalFeedback / 2),
        suggestedAction: {
          actionType: 'maintain_successful_patterns',
          proportion: categories.positive / totalFeedback
        }
      });
    }
    
    return insights;
  }
  
  /**
   * Get all historical insights.
   */
  getInsightHistory(): ReflectionInsight[] {
    return [...this.insightHistory];
  }
  
  /**
   * Get insights for a specific capacity.
   */
  getInsightsForCapacity(capacity: string): ReflectionInsight[] {
    return this.insightHistory.filter(insight => 
      insight.targetCapacity === capacity || insight.targetCapacity === 'all'
    );
  }
  
  /**
   * Get recent insights within a time period.
   */
  getRecentInsights(timeWindowMs: number = 7 * 24 * 60 * 60 * 1000): ReflectionInsight[] {
    const cutoffTime = Date.now() - timeWindowMs;
    return this.insightHistory.filter(insight => insight.timestamp >= cutoffTime);
  }
}
