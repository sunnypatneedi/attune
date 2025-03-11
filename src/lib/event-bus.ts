import { Subject } from 'rxjs';

// Define our event types
export interface EventBase {
  type: string;
  payload?: any;
}

export interface UserMessageEvent extends EventBase {
  type: 'userMessage';
  payload: {
    id?: number;
    text: string;
    timestamp?: number;
  };
}

export interface BotMessageEvent extends EventBase {
  type: 'botMessage';
  payload: {
    id?: number;
    text: string;
    timestamp?: number;
  };
}

export interface TypingEvent extends EventBase {
  type: 'typing';
  payload: {
    isTyping: boolean;
    sender: 'user' | 'bot';
  };
}

export interface ThemeChangeEvent extends EventBase {
  type: 'themeChange';
  payload: {
    theme: 'light' | 'dark';
  };
}

export type AppEvent = 
  | UserMessageEvent 
  | BotMessageEvent 
  | TypingEvent 
  | ThemeChangeEvent
  | EventBase;

// Create our event bus
export const eventBus = new Subject<AppEvent>();

// Helper functions to dispatch common events
export const dispatchUserMessage = (text: string) => {
  const event: UserMessageEvent = {
    type: 'userMessage',
    payload: {
      text,
      timestamp: Date.now(),
    },
  };
  eventBus.next(event);
  return event;
};

export const dispatchBotMessage = (text: string) => {
  const event: BotMessageEvent = {
    type: 'botMessage',
    payload: {
      text,
      timestamp: Date.now(),
    },
  };
  eventBus.next(event);
  return event;
};

export const dispatchTyping = (isTyping: boolean, sender: 'user' | 'bot') => {
  const event: TypingEvent = {
    type: 'typing',
    payload: {
      isTyping,
      sender,
    },
  };
  eventBus.next(event);
  return event;
};

export const dispatchThemeChange = (theme: 'light' | 'dark') => {
  const event: ThemeChangeEvent = {
    type: 'themeChange',
    payload: {
      theme,
    },
  };
  eventBus.next(event);
  return event;
};
