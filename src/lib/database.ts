// Import only the type for TypeScript support, not the actual implementation
import type { Database } from 'sql.js';

// Use dynamic import to avoid the Node.js fs module being loaded on the client side
// This function is an asynchronous function that will dynamically import sql.js only in the browser
async function getSqlJs() {
  // Make sure we're in the browser
  if (typeof window === 'undefined') {
    throw new Error('Cannot initialize database outside of browser environment');
  }
  
  // Dynamically import sql.js only on the client side
  const sqlJs = await import('sql.js');
  return sqlJs.default;
}

// Database singleton instance
let dbInstance: Database | null = null;

// Initialize SQL.js and load or create the database
export async function initDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    // Initialize sql.js with dynamic import
    const initSqlJs = await getSqlJs();
    const SQL = await initSqlJs({
      locateFile: (file) => `/sql-wasm.wasm`
    });

    // Try to load existing database from localStorage
    let db: Database;
    const savedDb = localStorage.getItem('db_save');

    if (savedDb) {
      try {
        const arr = JSON.parse(savedDb);
        const uint8Array = new Uint8Array(arr);
        db = new SQL.Database(uint8Array);
        console.log('Database loaded from localStorage');
      } catch (e) {
        console.error('Error loading database from localStorage:', e);
        db = new SQL.Database();
        console.log('Created new database instead');
      }
    } else {
      db = new SQL.Database();
      console.log('Created new database');
    }

    // Create tables if they don't exist
    createTables(db);
    
    // Set the singleton instance
    dbInstance = db;
    
    // Set up periodic saving
    if (typeof window !== 'undefined') {
      // Save on page unload
      window.addEventListener('beforeunload', () => saveDatabase(db));
      
      // Also save periodically (every 30 seconds)
      setInterval(() => saveDatabase(db), 30000);
    }
    
    return db;
  } catch (e) {
    console.error('Error initializing database:', e);
    throw e;
  }
}

// Create necessary tables
function createTables(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS preferences (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

// Save the database to localStorage
export function saveDatabase(db: Database): void {
  if (typeof window === 'undefined' || !db) return;
  
  try {
    const data = db.export();
    const arr = Array.from(data);
    localStorage.setItem('db_save', JSON.stringify(arr));
    console.log('Database saved to localStorage');
  } catch (e) {
    console.error('Error saving database:', e);
  }
}

// Message operations
export interface Message {
  id?: number;
  sender: 'user' | 'bot';
  content: string;
  timestamp: number;
}

export function addMessage(db: Database, message: Message): number {
  const stmt = db.prepare(
    'INSERT INTO messages (sender, content, timestamp) VALUES (?, ?, ?)'
  );
  stmt.run([message.sender, message.content, message.timestamp]);
  stmt.free();
  
  // Get the last inserted id
  const result = db.exec('SELECT last_insert_rowid()');
  const id = result[0].values[0][0] as number;
  
  // Save after each message
  saveDatabase(db);
  
  return id;
}

export function getMessages(db: Database): Message[] {
  try {
    const result = db.exec('SELECT id, sender, content, timestamp FROM messages ORDER BY timestamp ASC');
    
    if (result.length === 0) {
      return [];
    }
    
    return result[0].values.map((row) => ({
      id: row[0] as number,
      sender: row[1] as 'user' | 'bot',
      content: row[2] as string,
      timestamp: row[3] as number
    }));
  } catch (e) {
    console.error('Error getting messages:', e);
    return [];
  }
}

// Preference operations
export function setPreference(db: Database, key: string, value: string): void {
  const stmt = db.prepare(
    'INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)'
  );
  stmt.run([key, value]);
  stmt.free();
  
  // Save after setting preference
  saveDatabase(db);
}

export function getPreference(db: Database, key: string, defaultValue: string = ''): string {
  try {
    const stmt = db.prepare('SELECT value FROM preferences WHERE key = ?');
    const result = stmt.get([key]) as unknown;
    stmt.free();
    
    // Check if result is a valid object with a value property
    if (result && typeof result === 'object' && result !== null && 'value' in result) {
      const typedResult = result as { value: unknown };
      return String(typedResult.value);
    }
    
    return defaultValue;
  } catch (e) {
    console.error(`Error getting preference for key ${key}:`, e);
    return defaultValue;
  }
}

// Delete all data (for testing or reset functionality)
export function clearDatabase(db: Database): void {
  db.exec('DELETE FROM messages; DELETE FROM preferences;');
  saveDatabase(db);
}
