import { useEffect, useState } from 'react';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppEvent, EventBase, eventBus } from './event-bus';

// Custom hook to subscribe to the event bus
export function useEventBus<T extends EventBase>(
  eventType?: string,
  initialState?: T['payload']
): [T['payload'] | undefined, (event: T) => void] {
  const [state, setState] = useState<T['payload'] | undefined>(initialState);

  useEffect(() => {
    let subscription: Subscription;

    if (eventType) {
      // Subscribe to events of the specified type
      subscription = eventBus
        .pipe(filter((event) => event.type === eventType))
        .subscribe((event) => {
          setState(event.payload);
        });
    } else {
      // Subscribe to all events
      subscription = eventBus.subscribe((event) => {
        setState(event.payload);
      });
    }

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [eventType]);

  // Function to publish an event
  const publish = (event: T) => {
    eventBus.next(event);
  };

  return [state, publish];
}

// Custom hook to subscribe to multiple event types
export function useMultiEventBus<T extends AppEvent>(
  eventTypes: string[]
): Observable<T> {
  return new Observable<T>((subscriber) => {
    const subscription = eventBus
      .pipe(filter((event) => eventTypes.includes(event.type)))
      .subscribe((event) => {
        subscriber.next(event as T);
      });

    // Cleanup on unsubscribe
    return () => {
      subscription.unsubscribe();
    };
  });
}

// Specialized hook for message events
export function useMessages(): [
  { user: string[]; bot: string[] },
  (text: string, sender: 'user' | 'bot') => void
] {
  const [messages, setMessages] = useState<{ user: string[]; bot: string[] }>({
    user: [],
    bot: [],
  });

  useEffect(() => {
    const subscription = eventBus.subscribe((event) => {
      if (event.type === 'userMessage' && event.payload?.text) {
        setMessages((prev) => ({
          ...prev,
          user: [...prev.user, event.payload.text],
        }));
      } else if (event.type === 'botMessage' && event.payload?.text) {
        setMessages((prev) => ({
          ...prev,
          bot: [...prev.bot, event.payload.text],
        }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const sendMessage = (text: string, sender: 'user' | 'bot') => {
    if (sender === 'user') {
      eventBus.next({
        type: 'userMessage',
        payload: { text, timestamp: Date.now() },
      });
    } else {
      eventBus.next({
        type: 'botMessage',
        payload: { text, timestamp: Date.now() },
      });
    }
  };

  return [messages, sendMessage];
}
