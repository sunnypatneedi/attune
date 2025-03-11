import { 
  InteractionLog, 
  InteractionEvent, 
  LogQueryParams,
  EngagementResponse,
  Message
} from '../../types';
import { StorageManager } from '../../state-management/storage-manager';

/**
 * InteractionLogger tracks and stores interactions for later analysis.
 * It provides methods to query past interactions to identify patterns.
 */
export class InteractionLogger {
  private logs: InteractionLog[] = [];
  private storageManager: StorageManager;
  private maxInMemoryLogs: number = 100;
  
  constructor(storageManager: StorageManager) {
    this.storageManager = storageManager;
    this.loadRecentLogs();
  }
  
  /**
   * Log a user message.
   */
  logUserMessage(message: Message, conversationId: string): void {
    this.logInteraction({
      type: 'user_message',
      timestamp: Date.now(),
      conversationId,
      message,
      metadata: {}
    });
  }
  
  /**
   * Log a system response.
   */
  logSystemResponse(response: EngagementResponse, conversationId: string): void {
    this.logInteraction({
      type: 'system_response',
      timestamp: Date.now(),
      conversationId,
      response,
      metadata: {
        processingTime: response.metadata?.processingTime || 0,
        appliedValues: response.valueBasis || []
      }
    });
  }
  
  /**
   * Log a user feedback event.
   */
  logUserFeedback(feedback: any, conversationId: string): void {
    this.logInteraction({
      type: 'user_feedback',
      timestamp: Date.now(),
      conversationId,
      feedback,
      metadata: {}
    });
  }
  
  /**
   * Log a user interface interaction.
   */
  logUIInteraction(action: string, element: string, conversationId: string, details?: any): void {
    this.logInteraction({
      type: 'ui_interaction',
      timestamp: Date.now(),
      conversationId,
      action,
      element,
      details,
      metadata: {}
    });
  }
  
  /**
   * Log an error event.
   */
  logError(error: Error, context: any, conversationId: string): void {
    this.logInteraction({
      type: 'error',
      timestamp: Date.now(),
      conversationId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      metadata: {}
    });
  }
  
  /**
   * Record a generic interaction event.
   */
  private logInteraction(event: InteractionEvent): void {
    // Create log entry
    const log: InteractionLog = {
      id: this.generateLogId(),
      event,
      createdAt: Date.now()
    };
    
    // Add to in-memory collection
    this.logs.push(log);
    
    // Maintain size limit for in-memory logs
    if (this.logs.length > this.maxInMemoryLogs) {
      this.logs.shift(); // Remove oldest log
    }
    
    // Persist to storage
    this.storageManager.saveInteractionLog(log)
      .catch(err => console.error('Failed to save interaction log:', err));
  }
  
  /**
   * Generate a unique ID for a log entry.
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Load recent logs from storage.
   */
  private async loadRecentLogs(): Promise<void> {
    try {
      const recentLogs = await this.storageManager.getRecentInteractionLogs(this.maxInMemoryLogs);
      this.logs = recentLogs;
    } catch (err) {
      console.error('Failed to load recent interaction logs:', err);
    }
  }
  
  /**
   * Query logs based on specified parameters.
   */
  async queryLogs(params: LogQueryParams): Promise<InteractionLog[]> {
    const { 
      timeStart, 
      timeEnd, 
      eventTypes, 
      conversationId, 
      limit, 
      includeMetadata 
    } = params;
    
    // First check in-memory logs
    let results = this.logs.filter(log => {
      // Filter by time range
      if (timeStart && log.createdAt < timeStart) return false;
      if (timeEnd && log.createdAt > timeEnd) return false;
      
      // Filter by event type
      if (eventTypes && !eventTypes.includes(log.event.type)) return false;
      
      // Filter by conversation
      if (conversationId && log.event.conversationId !== conversationId) return false;
      
      return true;
    });
    
    // If we don't have enough results, query storage
    if (!limit || results.length < limit) {
      try {
        const storageLogs = await this.storageManager.queryInteractionLogs(params);
        
        // Merge with in-memory results, removing duplicates
        const existingIds = new Set(results.map(log => log.id));
        const uniqueStorageLogs = storageLogs.filter(log => !existingIds.has(log.id));
        
        results = [...results, ...uniqueStorageLogs];
      } catch (err) {
        console.error('Error querying interaction logs from storage:', err);
      }
    }
    
    // Apply limit
    if (limit && results.length > limit) {
      results = results.slice(0, limit);
    }
    
    // Remove metadata if not requested
    if (!includeMetadata) {
      results = results.map(log => ({
        ...log,
        event: {
          ...log.event,
          metadata: {}
        }
      }));
    }
    
    return results;
  }
  
  /**
   * Get logs for a specific conversation.
   */
  async getConversationLogs(conversationId: string): Promise<InteractionLog[]> {
    return this.queryLogs({
      conversationId,
      limit: 100,
      includeMetadata: true
    });
  }
  
  /**
   * Get recent error logs.
   */
  async getRecentErrorLogs(limit: number = 10): Promise<InteractionLog[]> {
    return this.queryLogs({
      eventTypes: ['error'],
      limit,
      includeMetadata: true
    });
  }
  
  /**
   * Get user feedback logs.
   */
  async getUserFeedbackLogs(limit: number = 50): Promise<InteractionLog[]> {
    return this.queryLogs({
      eventTypes: ['user_feedback'],
      limit,
      includeMetadata: true
    });
  }
  
  /**
   * Clear all logs (for testing or privacy purposes).
   */
  async clearLogs(): Promise<void> {
    this.logs = [];
    await this.storageManager.clearInteractionLogs();
  }
}
