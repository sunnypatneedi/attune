/**
 * Simple logger implementation with support for different log levels
 * and namespaces for better debugging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

export interface LoggerOptions {
  level?: LogLevel;
  enableConsole?: boolean;
  customHandler?: (level: LogLevel, namespace: string, message: string, ...args: any[]) => void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Default configuration
let globalLogLevel: LogLevel = 'info';
let enableConsole = true;
let customLogHandler: ((level: LogLevel, namespace: string, message: string, ...args: any[]) => void) | undefined;

/**
 * Configure global logger settings
 */
export function configureLogger(options: LoggerOptions): void {
  if (options.level !== undefined) {
    globalLogLevel = options.level;
  }
  
  if (options.enableConsole !== undefined) {
    enableConsole = options.enableConsole;
  }
  
  if (options.customHandler) {
    customLogHandler = options.customHandler;
  }
}

/**
 * Create a logger instance with a specific namespace
 */
export function createLogger(namespace: string): Logger {
  const formatMessage = (message: string): string => {
    return `[${namespace}] ${message}`;
  };

  const shouldLog = (level: LogLevel): boolean => {
    return LOG_LEVELS[level] >= LOG_LEVELS[globalLogLevel];
  };

  const log = (level: LogLevel, message: string, ...args: any[]): void => {
    if (!shouldLog(level)) return;

    const formattedMessage = formatMessage(message);
    
    // Use custom handler if provided
    if (customLogHandler) {
      customLogHandler(level, namespace, message, ...args);
      return;
    }
    
    // Use console logging if enabled
    if (enableConsole) {
      switch (level) {
        case 'debug':
          console.debug(formattedMessage, ...args);
          break;
        case 'info':
          console.info(formattedMessage, ...args);
          break;
        case 'warn':
          console.warn(formattedMessage, ...args);
          break;
        case 'error':
          console.error(formattedMessage, ...args);
          break;
      }
    }
  };

  return {
    debug: (message: string, ...args: any[]) => log('debug', message, ...args),
    info: (message: string, ...args: any[]) => log('info', message, ...args),
    warn: (message: string, ...args: any[]) => log('warn', message, ...args),
    error: (message: string, ...args: any[]) => log('error', message, ...args),
  };
}
