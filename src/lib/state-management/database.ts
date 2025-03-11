import initSqlJs, { Database } from 'sql.js';
import { 
  Message, 
  Conversation, 
  Entity, 
  UserPreference, 
  Interaction,
  LearningMoment
} from '../types';

// Key for the database in localStorage
const DB_STORAGE_KEY = 'attune-db';

/**
 * Initialize the SQLite database.
 * If a database exists in localStorage, it will be loaded.
 * Otherwise, a new database will be created with the necessary schema.
 */
export async function initDatabase(): Promise<Database> {
  // Load SQL.js
  const SQL = await initSqlJs({
    locateFile: file => `/sql-wasm.wasm`
  });

  let db: Database;

  // Try to load the database from localStorage
  const savedDbData = localStorage.getItem(DB_STORAGE_KEY);
  
  if (savedDbData) {
    try {
      const data = new Uint8Array(JSON.parse(savedDbData));
      db = new SQL.Database(data);
      console.log('Database loaded from localStorage');
    } catch (error) {
      console.error('Error loading database from localStorage:', error);
      db = createNewDatabase(SQL);
    }
  } else {
    db = createNewDatabase(SQL);
  }

  return db;
}

/**
 * Create a new database with the necessary schema.
 */
function createNewDatabase(SQL: any): Database {
  const db = new SQL.Database();

  // Create conversation table
  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      participants TEXT NOT NULL,
      metadata TEXT
    );
  `);

  // Create messages table
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      metadata TEXT,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );
  `);

  // Create entities table
  db.run(`
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      attributes TEXT NOT NULL,
      first_seen INTEGER NOT NULL,
      last_seen INTEGER NOT NULL
    );
  `);

  // Create entity_references table
  db.run(`
    CREATE TABLE IF NOT EXISTS entity_references (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL,
      mention_text TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      message_id TEXT NOT NULL,
      FOREIGN KEY (entity_id) REFERENCES entities(id),
      FOREIGN KEY (message_id) REFERENCES messages(id)
    );
  `);

  // Create user_intentions table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_intentions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      confidence REAL NOT NULL,
      timestamp INTEGER NOT NULL,
      message_id TEXT NOT NULL,
      related_entities TEXT,
      FOREIGN KEY (message_id) REFERENCES messages(id)
    );
  `);

  // Create conversation_states table
  db.run(`
    CREATE TABLE IF NOT EXISTS conversation_states (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      stage TEXT NOT NULL,
      active_topics TEXT NOT NULL,
      recent_sentiment REAL NOT NULL,
      engagement_level REAL NOT NULL,
      user_satisfaction REAL NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );
  `);

  // Create environmental_factors table
  db.run(`
    CREATE TABLE IF NOT EXISTS environmental_factors (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      value TEXT NOT NULL,
      confidence REAL NOT NULL,
      timestamp INTEGER NOT NULL
    );
  `);

  // Create user_preferences table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      value TEXT NOT NULL,
      confidence REAL NOT NULL,
      last_updated INTEGER NOT NULL,
      source TEXT NOT NULL
    );
  `);

  // Create interactions table
  db.run(`
    CREATE TABLE IF NOT EXISTS interactions (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      interaction_type TEXT NOT NULL,
      context_data TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (message_id) REFERENCES messages(id)
    );
  `);

  // Create learning_moments table
  db.run(`
    CREATE TABLE IF NOT EXISTS learning_moments (
      id TEXT PRIMARY KEY,
      interaction_id TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      understanding TEXT NOT NULL,
      response TEXT NOT NULL,
      reflection TEXT NOT NULL,
      FOREIGN KEY (interaction_id) REFERENCES interactions(id)
    );
  `);

  console.log('New database created with schema');
  return db;
}

/**
 * Save the database to localStorage.
 */
export function saveDatabase(db: Database): void {
  try {
    const data = db.export();
    const jsonData = JSON.stringify(Array.from(data));
    localStorage.setItem(DB_STORAGE_KEY, jsonData);
    console.log('Database saved to localStorage');
  } catch (error) {
    console.error('Error saving database to localStorage:', error);
  }
}

/**
 * Save a conversation to the database.
 */
export function saveConversation(db: Database, conversation: Conversation): string {
  const { id, startTime, endTime, participants, metadata } = conversation;
  
  db.run(
    `INSERT OR REPLACE INTO conversations (
      id, start_time, end_time, participants, metadata
    ) VALUES (?, ?, ?, ?, ?)`,
    [
      id,
      startTime,
      endTime || null,
      JSON.stringify(participants),
      JSON.stringify(metadata || {})
    ]
  );
  
  return id;
}

/**
 * Get a conversation from the database by ID.
 */
export function getConversation(db: Database, id: string): Conversation | null {
  const result = db.exec(
    `SELECT id, start_time, end_time, participants, metadata 
     FROM conversations 
     WHERE id = ?`,
    [id]
  );
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }
  
  const [conversationId, startTime, endTime, participants, metadata] = result[0].values[0];
  
  return {
    id: conversationId as string,
    startTime: startTime as number,
    endTime: endTime as number | null,
    participants: JSON.parse(participants as string),
    metadata: JSON.parse(metadata as string || '{}')
  };
}

/**
 * Get all conversations from the database.
 */
export function getAllConversations(db: Database): Conversation[] {
  const result = db.exec(
    `SELECT id, start_time, end_time, participants, metadata 
     FROM conversations 
     ORDER BY start_time DESC`
  );
  
  if (result.length === 0) {
    return [];
  }
  
  return result[0].values.map(row => {
    const [id, startTime, endTime, participants, metadata] = row;
    
    return {
      id: id as string,
      startTime: startTime as number,
      endTime: endTime as number | null,
      participants: JSON.parse(participants as string),
      metadata: JSON.parse(metadata as string || '{}')
    };
  });
}

/**
 * Save a message to the database.
 */
export function saveMessage(db: Database, message: Message): string {
  const { id, conversationId, sender, content, timestamp, metadata } = message;

  let contentStr: string;
  if (typeof content === 'string') {
    contentStr = content;
  } else {
    contentStr = JSON.stringify(content);
  }
  
  db.run(
    `INSERT OR REPLACE INTO messages (
      id, conversation_id, sender, content, timestamp, metadata
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      conversationId,
      sender,
      contentStr,
      timestamp,
      JSON.stringify(metadata || {})
    ]
  );
  
  return id;
}

/**
 * Get messages for a conversation from the database.
 */
export function getMessagesForConversation(db: Database, conversationId: string): Message[] {
  const result = db.exec(
    `SELECT id, conversation_id, sender, content, timestamp, metadata 
     FROM messages 
     WHERE conversation_id = ? 
     ORDER BY timestamp ASC`,
    [conversationId]
  );
  
  if (result.length === 0) {
    return [];
  }
  
  return result[0].values.map(row => {
    const [id, convoId, sender, content, timestamp, metadata] = row;
    
    // Try to parse JSON content, fallback to string if not valid JSON
    let parsedContent: string | Record<string, any> = content as string;
    try {
      parsedContent = JSON.parse(content as string);
    } catch (e) {
      // Not JSON, keep as string
    }
    
    return {
      id: id as string,
      conversationId: convoId as string,
      sender: sender as 'user' | 'assistant' | 'system',
      content: parsedContent,
      timestamp: timestamp as number,
      metadata: JSON.parse(metadata as string || '{}')
    };
  });
}

/**
 * Save an entity to the database.
 */
export function saveEntity(db: Database, entity: Entity): string {
  const { id, type, name, attributes, firstSeen, lastSeen } = entity;
  
  db.run(
    `INSERT OR REPLACE INTO entities (
      id, type, name, attributes, first_seen, last_seen
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      type,
      name,
      JSON.stringify(attributes || {}),
      firstSeen,
      lastSeen
    ]
  );
  
  return id;
}

/**
 * Get an entity from the database by ID.
 */
export function getEntity(db: Database, id: string): Entity | null {
  const result = db.exec(
    `SELECT id, type, name, attributes, first_seen, last_seen 
     FROM entities 
     WHERE id = ?`,
    [id]
  );
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }
  
  const [entityId, type, name, attributes, firstSeen, lastSeen] = result[0].values[0];
  
  return {
    id: entityId as string,
    type: type as string,
    name: name as string,
    attributes: JSON.parse(attributes as string),
    firstSeen: firstSeen as number,
    lastSeen: lastSeen as number
  };
}

/**
 * Save a user preference to the database.
 */
export function saveUserPreference(db: Database, preference: UserPreference): string {
  const { id, category, value, confidence, lastUpdated, source } = preference;
  
  db.run(
    `INSERT OR REPLACE INTO user_preferences (
      id, category, value, confidence, last_updated, source
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      category,
      JSON.stringify(value),
      confidence,
      lastUpdated,
      source
    ]
  );
  
  return id;
}

/**
 * Get user preferences from the database by category.
 */
export function getUserPreferencesByCategory(db: Database, category: string): UserPreference[] {
  const result = db.exec(
    `SELECT id, category, value, confidence, last_updated, source 
     FROM user_preferences 
     WHERE category = ? 
     ORDER BY confidence DESC`,
    [category]
  );
  
  if (result.length === 0) {
    return [];
  }
  
  return result[0].values.map(row => {
    const [id, cat, value, confidence, lastUpdated, source] = row;
    
    return {
      id: id as string,
      category: cat as string,
      value: JSON.parse(value as string),
      confidence: confidence as number,
      lastUpdated: lastUpdated as number,
      source: source as 'explicit' | 'implicit' | 'default'
    };
  });
}

/**
 * Save an interaction to the database.
 */
export function saveInteraction(db: Database, interaction: Interaction): string {
  const { id, messageId, interactionType, contextData, timestamp } = interaction;
  
  db.run(
    `INSERT OR REPLACE INTO interactions (
      id, message_id, interaction_type, context_data, timestamp
    ) VALUES (?, ?, ?, ?, ?)`,
    [
      id,
      messageId,
      interactionType,
      JSON.stringify(contextData || {}),
      timestamp
    ]
  );
  
  return id;
}

/**
 * Save a learning moment to the database.
 */
export function saveLearningMoment(db: Database, moment: LearningMoment): string {
  const { timestamp, interactionId, understanding, response, reflection } = moment;
  const id = `lm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  db.run(
    `INSERT INTO learning_moments (
      id, interaction_id, timestamp, understanding, response, reflection
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      interactionId,
      timestamp,
      JSON.stringify(understanding),
      JSON.stringify(response),
      JSON.stringify(reflection)
    ]
  );
  
  return id;
}

/**
 * Get learning moments from the database.
 */
export function getLearningMoments(db: Database, limit = 20): LearningMoment[] {
  const result = db.exec(
    `SELECT interaction_id, timestamp, understanding, response, reflection 
     FROM learning_moments 
     ORDER BY timestamp DESC 
     LIMIT ?`,
    [limit]
  );
  
  if (result.length === 0) {
    return [];
  }
  
  return result[0].values.map(row => {
    const [interactionId, timestamp, understanding, response, reflection] = row;
    
    return {
      interactionId: interactionId as string,
      timestamp: timestamp as number,
      understanding: JSON.parse(understanding as string),
      response: JSON.parse(response as string),
      reflection: JSON.parse(reflection as string)
    } as LearningMoment;
  });
}
