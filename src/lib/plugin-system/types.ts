/**
 * Core plugin system types for the Attune framework
 * Enables extensibility through well-defined interfaces
 */

/**
 * Base plugin interface that all plugins must implement
 */
export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
}

/**
 * Registry for all plugins in the system
 */
export interface PluginRegistry {
  register: (plugin: Plugin) => void;
  unregister: (pluginId: string) => void;
  getPlugin: <T extends Plugin>(pluginId: string) => T | undefined;
  getPlugins: <T extends Plugin>(type?: string) => T[];
  enablePlugin: (pluginId: string) => void;
  disablePlugin: (pluginId: string) => void;
}

/**
 * Message processor plugin interface
 */
export interface MessageProcessorPlugin extends Plugin {
  type: 'message-processor';
  processMessage: (message: string, context: MessageContext) => Promise<ProcessedMessage>;
}

/**
 * Entity extractor plugin interface
 */
export interface EntityExtractorPlugin extends Plugin {
  type: 'entity-extractor';
  extractEntities: (message: string, context: MessageContext) => Promise<Entity[]>;
}

/**
 * Intent detector plugin interface
 */
export interface IntentDetectorPlugin extends Plugin {
  type: 'intent-detector';
  detectIntent: (message: string, context: MessageContext) => Promise<Intent>;
}

/**
 * Response generator plugin interface
 */
export interface ResponseGeneratorPlugin extends Plugin {
  type: 'response-generator';
  generateResponse: (message: string, context: MessageContext) => Promise<string>;
}

/**
 * UI component plugin interface
 */
export interface UIComponentPlugin extends Plugin {
  type: 'ui-component';
  component: React.ComponentType<any>;
  mountPoint: UIComponentMountPoint;
  priority: number;
}

/**
 * Mount points for UI component plugins
 */
export type UIComponentMountPoint = 
  | 'chat-header'
  | 'chat-input'
  | 'message-display'
  | 'info-panel'
  | 'chat-container';

/**
 * Message context containing the current state and history
 */
export interface MessageContext {
  workingMemory: WorkingMemory;
  messages: Message[];
  patterns: Pattern[];
  sessionId: string;
  userId?: string;
  metadata: Record<string, any>;
}

/**
 * Working memory structure
 */
export interface WorkingMemory {
  activeTopics: string[];
  recentEntities: string[];
  turns: number;
  contexts: ContextLayer[];
  [key: string]: any; // Allow extensions
}

/**
 * Context layer for hierarchical context management
 */
export interface ContextLayer {
  id: string;
  name: string;
  priority: number;
  data: Record<string, any>;
  ttl?: number; // Time to live in milliseconds
}

/**
 * Message structure
 */
export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  intention?: string;
  entities?: Entity[];
  metadata?: Record<string, any>;
}

/**
 * Processed message with extracted information
 */
export interface ProcessedMessage {
  content: string;
  intent?: Intent;
  entities: Entity[];
  topics: string[];
  sentiment?: string;
  confidence: number;
  metadata: Record<string, any>;
}

/**
 * Entity extracted from a message
 */
export interface Entity {
  name: string;
  type: string;
  value?: any;
  confidence: number;
  startIndex?: number;
  endIndex?: number;
  metadata?: Record<string, any>;
}

/**
 * Intent detected from a message
 */
export interface Intent {
  name: string;
  confidence: number;
  parameters?: Record<string, any>;
}

/**
 * Pattern identified in user behavior
 */
export interface Pattern {
  name: string;
  confidence: number;
  occurrences: number;
  lastSeen: string;
  metadata?: Record<string, any>;
}

/**
 * Configuration options for the framework
 */
export interface ConfigOptions {
  enabledPlugins: string[];
  uiOptions: UIOptions;
  processingOptions: ProcessingOptions;
  storageOptions: StorageOptions;
}

export interface UIOptions {
  theme: 'light' | 'dark' | 'system';
  layout: 'default' | 'compact' | 'expanded';
  showInfoPanel: boolean;
  messageBubbleStyle: 'rounded' | 'rectangle' | 'custom';
  colorScheme: Record<string, string>;
  customCss?: string;
}

export interface ProcessingOptions {
  enableIntentDetection: boolean;
  enableEntityExtraction: boolean;
  enablePatternRecognition: boolean;
  processingDelay: number;
}

export interface StorageOptions {
  persistMessages: boolean;
  persistWorkingMemory: boolean;
  storageType: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'custom';
  customStorageImplementation?: any;
}
