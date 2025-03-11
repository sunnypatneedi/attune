/**
 * Event Bus implementation based on Observable pattern
 * Enables loose coupling between components through events
 */

import { Subject, Observable, filter } from 'rxjs';
import { createLogger } from '../logger';

const logger = createLogger('EventBus');

export interface EventPayload<T = any> {
  type: string;
  payload: T;
  metadata?: Record<string, any>;
  timestamp: number;
}

class EventBus {
  private events$ = new Subject<EventPayload>();

  /**
   * Publish an event to the bus
   * @param type Event type
   * @param payload Event data
   * @param metadata Optional metadata
   */
  publish<T = any>(type: string, payload: T, metadata?: Record<string, any>): void {
    const event: EventPayload<T> = {
      type,
      payload,
      metadata,
      timestamp: Date.now(),
    };

    logger.debug(`Publishing event: ${type}`, { payload, metadata });
    this.events$.next(event);
  }

  /**
   * Subscribe to events of a specific type
   * @param type Event type to subscribe to
   * @returns Observable of events
   */
  on<T = any>(type: string): Observable<EventPayload<T>> {
    return this.events$.pipe(
      filter((event): event is EventPayload<T> => event.type === type)
    );
  }

  /**
   * Subscribe to all events
   * @returns Observable of all events
   */
  onAny<T = any>(): Observable<EventPayload<T>> {
    return this.events$ as Observable<EventPayload<T>>;
  }
}

// Create singleton instance
export const eventBus = new EventBus();

// Export factory function for testing purposes
export const createEventBus = (): EventBus => new EventBus();
