/**
 * Plugin Registry implementation
 * Central system for registering, managing and accessing plugins
 * Optimized for TypeScript 7.0 compatibility
 */

import type { Plugin, PluginRegistry } from './types';
import { createLogger } from '../logger';

type PluginEvent = 'plugin:registered' | 'plugin:unregistered' | 'plugin:enabled' | 'plugin:disabled';
type EventCallback<T = unknown> = (data: T) => void;
type TypedPlugin<T extends string> = Plugin & { type: T };

const logger = createLogger('PluginRegistry');

class PluginRegistryImpl implements PluginRegistry {
  // Use more specific typing for TypeScript 7.0 performance
  readonly #plugins = new Map<string, Plugin>();
  readonly #pluginsByType = new Map<string, Set<string>>();
  readonly #eventListeners = new Map<string, Set<EventCallback>>();

  /**
   * Register a plugin with the system
   * @param plugin The plugin to register
   */
  register = (plugin: Plugin): void => {
    if (this.#plugins.has(plugin.id)) {
      logger.warn(`Plugin with ID ${plugin.id} is already registered. Unregister it first to update.`);
      return;
    }

    this.#plugins.set(plugin.id, plugin);
    
    // Index by type if available - using type checking instead of casting
    if ('type' in plugin) {
      const typedPlugin = plugin as { type: string };
      const type = typedPlugin.type;
      
      const typePlugins = this.#pluginsByType.get(type) ?? new Set<string>();
      typePlugins.add(plugin.id);
      this.#pluginsByType.set(type, typePlugins);
    }

    logger.info(`Plugin registered: ${plugin.name} (${plugin.id})`);
    this.#emitEvent('plugin:registered', plugin);
  };

  /**
   * Unregister a plugin by ID
   * @param pluginId ID of the plugin to unregister
   */
  unregister = (pluginId: string): void => {
    const plugin = this.#plugins.get(pluginId);
    if (!plugin) {
      logger.warn(`Cannot unregister plugin with ID ${pluginId}: not found`);
      return;
    }

    this.#plugins.delete(pluginId);
    
    // Remove from type index with proper type checking
    if ('type' in plugin) {
      const typedPlugin = plugin as { type: string };
      const typePlugins = this.#pluginsByType.get(typedPlugin.type);
      typePlugins?.delete(pluginId);
      
      // Clean up empty sets
      if (typePlugins?.size === 0) {
        this.#pluginsByType.delete(typedPlugin.type);
      }
    }

    logger.info(`Plugin unregistered: ${plugin.name} (${pluginId})`);
    this.#emitEvent('plugin:unregistered', plugin);
  };

  /**
   * Get a plugin by ID with type casting
   * @param pluginId The ID of the plugin to retrieve
   * @returns The plugin instance or undefined if not found
   */
  getPlugin = <T extends Plugin>(pluginId: string): T | undefined => {
    const plugin = this.#plugins.get(pluginId);
    return plugin as T | undefined;
  };

  /**
   * Get a typed plugin with stronger type guarantees
   * @param pluginId The ID of the plugin to retrieve
   * @param expectedType The expected plugin type
   * @returns The plugin instance or undefined if not found or wrong type
   */
  getTypedPlugin = <T extends string, P extends TypedPlugin<T>>(
    pluginId: string, 
    expectedType: T
  ): P | undefined => {
    const plugin = this.#plugins.get(pluginId);
    
    if (!plugin || !('type' in plugin)) {
      return undefined;
    }
    
    const typedPlugin = plugin as { type: string };
    return typedPlugin.type === expectedType ? plugin as P : undefined;
  };

  /**
   * Get all plugins of a specific type
   * @param type Optional plugin type to filter by
   * @returns Array of plugins
   */
  getPlugins = <T extends Plugin>(type?: string): T[] => {
    if (type) {
      const pluginIds = this.#pluginsByType.get(type) ?? new Set<string>();
      const plugins: T[] = [];
      
      // More explicit iteration for better TypeScript 7.0 optimization
      for (const id of pluginIds) {
        const plugin = this.#plugins.get(id);
        if (plugin) {
          plugins.push(plugin as T);
        }
      }
      
      return plugins;
    }
    
    return Array.from(this.#plugins.values()) as T[];
  };

  /**
   * Enable a plugin
   * @param pluginId ID of the plugin to enable
   */
  enablePlugin = (pluginId: string): void => {
    const plugin = this.#plugins.get(pluginId);
    if (!plugin) {
      logger.warn(`Cannot enable plugin with ID ${pluginId}: not found`);
      return;
    }

    plugin.enabled = true;
    logger.info(`Plugin enabled: ${plugin.name} (${pluginId})`);
    this.#emitEvent('plugin:enabled', plugin);
  };

  /**
   * Disable a plugin
   * @param pluginId ID of the plugin to disable
   */
  disablePlugin = (pluginId: string): void => {
    const plugin = this.#plugins.get(pluginId);
    if (!plugin) {
      logger.warn(`Cannot disable plugin with ID ${pluginId}: not found`);
      return;
    }

    plugin.enabled = false;
    logger.info(`Plugin disabled: ${plugin.name} (${pluginId})`);
    this.#emitEvent('plugin:disabled', plugin);
  };

  /**
   * Add an event listener with proper typing
   * @param event Event name
   * @param callback Callback function
   */
  addEventListener = <T>(event: PluginEvent, callback: EventCallback<T>): () => void => {
    if (!this.#eventListeners.has(event)) {
      this.#eventListeners.set(event, new Set());
    }
    
    const listeners = this.#eventListeners.get(event)!;
    listeners.add(callback as EventCallback);
    
    // Return cleanup function
    return () => {
      listeners.delete(callback as EventCallback);
    };
  };

  /**
   * Remove an event listener
   * @param event Event name
   * @param callback Callback function
   */
  removeEventListener = <T>(event: PluginEvent, callback: EventCallback<T>): void => {
    this.#eventListeners.get(event)?.delete(callback as EventCallback);
  };

  /**
   * Emit an event
   * @param event Event name
   * @param data Event data
   */
  #emitEvent = <T>(event: PluginEvent, data: T): void => {
    const listeners = this.#eventListeners.get(event);
    if (!listeners) return;
    
    for (const callback of listeners) {
      try {
        callback(data);
      } catch (error) {
        logger.error(`Error in event listener for "${event}":`, error);
      }
    }
  };
}

// Create singleton instance
export const pluginRegistry = new PluginRegistryImpl();

// Export factory function for testing purposes
export const createPluginRegistry = (): PluginRegistry => {
  return new PluginRegistryImpl();
};
