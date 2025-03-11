/**
 * Event Bus implementation based on Observable pattern
 * Enables loose coupling between components through events
 * Optimized for TypeScript 7.0 compatibility
 */

import { Subject, Observable, filter, share } from 'rxjs';
import type { OperatorFunction } from 'rxjs';
import { createLogger } from '../logger';

const logger = createLogger('EventBus');

/**
 * Event type definition with strongly typed payload
 */
export interface EventPayload<Type extends string = string, Payload = unknown> {
  readonly type: Type;
  readonly payload: Payload;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly timestamp: number;
}

// Helper type for extracting payload type from an event
export type PayloadOf<E extends EventPayload> = E['payload'];

/**
 * Type-safe event bus implementation using RxJS
 */
class EventBus {
  readonly #events$ = new Subject<EventPayload>();
  // Shared observable to prevent multiple subscriptions creating new channels
  readonly #sharedEvents$ = this.#events$.pipe(share());

  /**
   * Publish an event to the bus
   * @param type Event type
   * @param payload Event data
   * @param metadata Optional metadata
   */
  publish<Type extends string, Payload>(type: Type, payload: Payload, metadata?: Record<string, unknown>): void {
    const event: EventPayload<Type, Payload> = {
      type,
      payload,
      ...(metadata !== undefined ? { metadata } : {}),
      timestamp: Date.now(),
    };

    logger.debug(`Publishing event: ${type}`, { payload, metadata });
    this.#events$.next(event as EventPayload);
  }

  /**
   * Subscribe to events of a specific type with proper type inference
   * @param type Event type to subscribe to
   * @returns Observable of strongly typed events
   */
  on<Type extends string, Payload = unknown>(type: Type): Observable<EventPayload<Type, Payload>> {
    return this.#sharedEvents$.pipe(
      filter((event): event is EventPayload<Type, Payload> => event.type === type)
    );
  }

  /**
   * Filter events by a predicate
   * @param predicate Function to filter events
   * @returns Operator function for filtering events
   */
  filter<E extends EventPayload>(
    predicate: (event: EventPayload) => event is E
  ): OperatorFunction<EventPayload, E> {
    return filter(predicate);
  }

  /**
   * Subscribe to all events
   * @returns Observable of all events
   */
  onAny(): Observable<EventPayload> {
    return this.#sharedEvents$;
  }

  /**
   * Clean up resources when done
   */
  destroy(): void {
    this.#events$.complete();
  }
}

// Create singleton instance
export const eventBus = new EventBus();

// Export factory function for testing purposes
export const createEventBus = (): EventBus => new EventBus();
