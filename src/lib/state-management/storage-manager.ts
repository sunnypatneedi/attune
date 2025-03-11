import { Database } from 'sql.js';
import { 
  Conversation,
  Message,
  Entity,
  UserPreference,
  Interaction,
  LearningMoment
} from '../types';
import {
  initDatabase,
  saveDatabase,
  saveConversation,
  getConversation,
  getAllConversations,
  saveMessage,
  getMessagesForConversation,
  saveEntity,
  getEntity,
  saveUserPreference,
  getUserPreferencesByCategory,
  saveInteraction,
  saveLearningMoment,
  getLearningMoments
} from './database';

/**
 * StorageManager provides an interface for data persistence operations,
 * abstracting the underlying database implementation.
 */
export class StorageManager {
  private db: Database | null = null;
  private initialized = false;
  private saveInterval: NodeJS.Timeout | null = null;
  
  /**
   * Initialize the storage manager.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      this.db = await initDatabase();
      this.initialized = true;
      
      // Set up periodic saving
      this.saveInterval = setInterval(() => {
        this.persistToLocalStorage();
      }, 30000); // Save every 30 seconds
      
      // Set up saving on page unload
      window.addEventListener('beforeunload', () => {
        this.persistToLocalStorage();
      });
      
      console.log('Storage manager initialized');
    } catch (error) {
      console.error('Failed to initialize storage manager:', error);
      throw error;
    }
  }
  
  /**
   * Save the database to localStorage.
   */
  persistToLocalStorage(): void {
    if (!this.db) {
      console.warn('Cannot persist database: not initialized');
      return;
    }
    
    saveDatabase(this.db);
  }
  
  /**
   * Clean up resources on destruction.
   */
  destroy(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    
    // Final save before destruction
    this.persistToLocalStorage();
    
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    
    this.initialized = false;
  }
  
  /**
   * Ensure the database is initialized.
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.db) {
      throw new Error('Storage manager not initialized');
    }
  }
  
  /**
   * Generate a unique ID for different entity types.
   */
  generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Save a conversation to the database.
   */
  async saveConversation(conversation: Conversation): Promise<string> {
    this.ensureInitialized();
    
    const convo = {
      ...conversation,
      id: conversation.id || this.generateId('conv')
    };
    
    saveConversation(this.db!, convo);
    return convo.id;
  }
  
  /**
   * Get a conversation by ID.
   */
  async getConversation(id: string): Promise<Conversation | null> {
    this.ensureInitialized();
    return getConversation(this.db!, id);
  }
  
  /**
   * Get all conversations.
   */
  async getAllConversations(): Promise<Conversation[]> {
    this.ensureInitialized();
    return getAllConversations(this.db!);
  }
  
  /**
   * Save a message to the database.
   */
  async saveMessage(message: Message): Promise<string> {
    this.ensureInitialized();
    
    const msg = {
      ...message,
      id: message.id || this.generateId('msg')
    };
    
    saveMessage(this.db!, msg);
    return msg.id;
  }
  
  /**
   * Get messages for a conversation.
   */
  async getMessagesForConversation(conversationId: string): Promise<Message[]> {
    this.ensureInitialized();
    return getMessagesForConversation(this.db!, conversationId);
  }
  
  /**
   * Save an entity to the database.
   */
  async saveEntity(entity: Entity): Promise<string> {
    this.ensureInitialized();
    
    const ent = {
      ...entity,
      id: entity.id || this.generateId('ent')
    };
    
    saveEntity(this.db!, ent);
    return ent.id;
  }
  
  /**
   * Get an entity by ID.
   */
  async getEntity(id: string): Promise<Entity | null> {
    this.ensureInitialized();
    return getEntity(this.db!, id);
  }
  
  /**
   * Save a user preference to the database.
   */
  async saveUserPreference(preference: UserPreference): Promise<string> {
    this.ensureInitialized();
    
    const pref = {
      ...preference,
      id: preference.id || this.generateId('pref')
    };
    
    saveUserPreference(this.db!, pref);
    return pref.id;
  }
  
  /**
   * Get user preferences by category.
   */
  async getUserPreferencesByCategory(category: string): Promise<UserPreference[]> {
    this.ensureInitialized();
    return getUserPreferencesByCategory(this.db!, category);
  }
  
  /**
   * Save an interaction to the database.
   */
  async saveInteraction(interaction: Interaction): Promise<string> {
    this.ensureInitialized();
    
    const inter = {
      ...interaction,
      id: interaction.id || this.generateId('int')
    };
    
    saveInteraction(this.db!, inter);
    return inter.id;
  }
  
  /**
   * Save a learning moment to the database.
   */
  async saveLearningMoment(moment: LearningMoment): Promise<string> {
    this.ensureInitialized();
    return saveLearningMoment(this.db!, moment);
  }
  
  /**
   * Get learning moments from the database.
   */
  async getLearningMoments(limit = 20): Promise<LearningMoment[]> {
    this.ensureInitialized();
    return getLearningMoments(this.db!, limit);
  }
}
