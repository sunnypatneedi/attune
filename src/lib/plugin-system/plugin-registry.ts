/**
 * Plugin Registry implementation
 * Central system for registering, managing and accessing plugins
 */

import { Plugin, PluginRegistry } from './types';
import { createLogger } from '../logger';

const logger = createLogger('PluginRegistry');

class PluginRegistryImpl implements PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private pluginsByType: Map<string, Set<string>> = new Map();
  private eventListeners: Map<string, Set<Function>> = new Map();

  /**
   * Register a plugin with the system
   * @param plugin The plugin to register
   */
  register = (plugin: Plugin): void => {
    if (this.plugins.has(plugin.id)) {
      logger.warn(`Plugin with ID ${plugin.id} is already registered. Unregister it first to update.`);
      return;
    }

    this.plugins.set(plugin.id, plugin);
    
    // Index by type if available
    if ('type' in plugin) {
      const type = (plugin as any).type;
      if (!this.pluginsByType.has(type)) {
        this.pluginsByType.set(type, new Set());
      }
      this.pluginsByType.get(type)?.add(plugin.id);
    }

    logger.info(`Plugin registered: ${plugin.name} (${plugin.id})`);
    this.emitEvent('plugin:registered', plugin);
  };

  /**
   * Unregister a plugin by ID
   * @param pluginId ID of the plugin to unregister
   */
  unregister = (pluginId: string): void => {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      logger.warn(`Cannot unregister plugin with ID ${pluginId}: not found`);
      return;
    }

    this.plugins.delete(pluginId);
    
    // Remove from type index
    if ('type' in plugin) {
      const type = (plugin as any).type;
      this.pluginsByType.get(type)?.delete(pluginId);
    }

    logger.info(`Plugin unregistered: ${plugin.name} (${pluginId})`);
    this.emitEvent('plugin:unregistered', plugin);
  };

  /**
   * Get a plugin by ID with type casting
   * @param pluginId The ID of the plugin to retrieve
   * @returns The plugin instance or undefined if not found
   */
  getPlugin = <T extends Plugin>(pluginId: string): T | undefined => {
    return this.plugins.get(pluginId) as T | undefined;
  };

  /**
   * Get all plugins of a specific type
   * @param type Optional plugin type to filter by
   * @returns Array of plugins
   */
  getPlugins = <T extends Plugin>(type?: string): T[] => {
    if (type) {
      const pluginIds = this.pluginsByType.get(type) || new Set();
      return Array.from(pluginIds)
        .map(id => this.plugins.get(id))
        .filter(Boolean) as T[];
    }
    
    return Array.from(this.plugins.values()) as T[];
  };

  /**
   * Enable a plugin
   * @param pluginId ID of the plugin to enable
   */
  enablePlugin = (pluginId: string): void => {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      logger.warn(`Cannot enable plugin with ID ${pluginId}: not found`);
      return;
    }

    plugin.enabled = true;
    logger.info(`Plugin enabled: ${plugin.name} (${pluginId})`);
    this.emitEvent('plugin:enabled', plugin);
  };

  /**
   * Disable a plugin
   * @param pluginId ID of the plugin to disable
   */
  disablePlugin = (pluginId: string): void => {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      logger.warn(`Cannot disable plugin with ID ${pluginId}: not found`);
      return;
    }

    plugin.enabled = false;
    logger.info(`Plugin disabled: ${plugin.name} (${pluginId})`);
    this.emitEvent('plugin:disabled', plugin);
  };

  /**
   * Add an event listener
   * @param event Event name
   * @param callback Callback function
   */
  addEventListener = (event: string, callback: Function): void => {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback);
  };

  /**
   * Remove an event listener
   * @param event Event name
   * @param callback Callback function
   */
  removeEventListener = (event: string, callback: Function): void => {
    this.eventListeners.get(event)?.delete(callback);
  };

  /**
   * Emit an event
   * @param event Event name
   * @param data Event data
   */
  private emitEvent = (event: string, data: any): void => {
    this.eventListeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        logger.error(`Error in event listener for "${event}":`, error);
      }
    });
  };
}

// Create singleton instance
export const pluginRegistry = new PluginRegistryImpl();

// Export factory function for testing purposes
export const createPluginRegistry = (): PluginRegistry => {
  return new PluginRegistryImpl();
};
