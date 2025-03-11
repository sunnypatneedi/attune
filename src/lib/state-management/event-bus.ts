import { Subject, Observable, filter, map, share, pipe, OperatorFunction } from 'rxjs';
import { 
  Subscription, 
  EventHandler, 
  EventStream, 
  EventOperator, 
  Change,
  ChangeType
} from '../types';

/**
 * Enhanced EventBus for component communication and state synchronization
 */
export class EventBus {
  private subject: Subject<any>;
  private broadcastChannel: BroadcastChannel | null = null;
  private id: string;

  constructor(channelName: string = 'attune') {
    this.subject = new Subject<any>();
    this.id = `instance_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    this.initializeBroadcastChannel(channelName);
  }

  /**
   * Initialize the BroadcastChannel for cross-tab communication.
   * Falls back to localStorage if BroadcastChannel is not available.
   */
  private initializeBroadcastChannel(channelName: string): void {
    // Try to use BroadcastChannel API for cross-tab communication
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(channelName);
        this.broadcastChannel.onmessage = (event) => {
          // Only process messages from other instances
          if (event.data && event.data.sourceId !== this.id) {
            this.processExternalEvent(event.data.payload);
          }
        };
        console.log('BroadcastChannel initialized for cross-tab communication');
      } catch (error) {
        console.warn('Failed to initialize BroadcastChannel, falling back to localStorage:', error);
        this.initializeLocalStorageFallback(channelName);
      }
    } else {
      console.warn('BroadcastChannel not supported, falling back to localStorage');
      this.initializeLocalStorageFallback(channelName);
    }
  }

  /**
   * Initialize localStorage-based fallback for cross-tab communication.
   */
  private initializeLocalStorageFallback(channelName: string): void {
    const storageKey = `${channelName}_event`;
    
    // Listen for storage events
    window.addEventListener('storage', (event) => {
      if (event.key === storageKey) {
        try {
          const data = JSON.parse(event.newValue || '{}');
          // Only process messages from other instances
          if (data && data.sourceId !== this.id) {
            this.processExternalEvent(data.payload);
          }
        } catch (error) {
          console.error('Error processing storage event:', error);
        }
      }
    });
  }

  /**
   * Process events received from other tabs/windows.
   */
  private processExternalEvent(payload: any): void {
    // Emit the event locally without re-broadcasting
    this.subject.next(payload);
  }

  /**
   * Subscribe to events of a specific type.
   */
  subscribe<T>(eventType: string, handler: EventHandler): Subscription {
    const subscription = this.subject.pipe(
      filter((event: any) => {
        return event.type === eventType;
      }),
      map((event: any) => event.payload)
    ).subscribe(handler as any);

    return {
      unsubscribe: () => subscription.unsubscribe()
    };
  }

  /**
   * Publish an event.
   */
  publish(eventType: string, payload: any): void {
    const event = {
      type: eventType,
      payload,
      timestamp: Date.now()
    };

    // Emit locally
    this.subject.next(event);

    // Broadcast to other tabs
    this.broadcastToOtherTabs(event);
  }

  /**
   * Broadcast a change to other tabs/windows.
   */
  private broadcastToOtherTabs(event: any): void {
    const message = {
      sourceId: this.id,
      payload: event
    };

    // Try BroadcastChannel first
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(message);
    } else {
      // Fall back to localStorage
      try {
        const storageKey = 'attune_event';
        localStorage.setItem(storageKey, JSON.stringify(message));
        // Trigger a custom event to notify same-tab listeners
        window.dispatchEvent(new CustomEvent('attune-local-broadcast', { detail: message }));
      } catch (error) {
        console.error('Error broadcasting via localStorage:', error);
      }
    }
  }

  /**
   * Broadcast a state change to all instances.
   */
  broadcastChange(changeType: ChangeType, payload: any): void {
    const change: Change = {
      changeType,
      payload,
      timestamp: Date.now(),
      source: this.id
    };

    this.publish('state-change', change);
  }

  /**
   * Apply an operator to the event stream.
   */
  pipe(operator: EventOperator): EventStream {
    const observable = operator.apply({
      subscribe: (handler: EventHandler) => {
        const subscription = this.subject.subscribe(handler as any);
        return {
          unsubscribe: () => subscription.unsubscribe()
        };
      }
    });

    return observable;
  }

  /**
   * Get a stream of events of a specific type.
   */
  ofType<T>(eventType: string): Observable<T> {
    return this.subject.pipe(
      filter((event: any) => event.type === eventType),
      map((event: any) => event.payload),
      share()
    );
  }

  /**
   * Get a stream of state changes of a specific type.
   */
  ofChangeType<T>(changeType: ChangeType): Observable<T> {
    return this.subject.pipe(
      filter((event: any) => event.type === 'state-change'),
      map((event: any) => event.payload),
      filter((change: Change) => change.changeType === changeType),
      map((change: Change) => change.payload),
      share()
    );
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    this.subject.complete();
  }
}

/**
 * Create standard operators for the event bus.
 */
export const eventOperators = {
  /**
   * Filter events by type.
   */
  filterByType: (type: string): OperatorFunction<any, any> => {
    return pipe(
      filter((event: any) => event.type === type),
      map((event: any) => event.payload)
    );
  },

  /**
   * Filter state changes by change type.
   */
  filterByChangeType: (changeType: ChangeType): OperatorFunction<any, any> => {
    return pipe(
      filter((event: any) => event.type === 'state-change'),
      map((event: any) => event.payload),
      filter((change: Change) => change.changeType === changeType),
      map((change: Change) => change.payload)
    );
  },

  /**
   * Debounce events.
   */
  debounceEvents: (time: number): OperatorFunction<any, any> => {
    return pipe(
      filter((event: any) => {
        const now = Date.now();
        const lastEventTime = (event as any)._lastTime || 0;
        if (now - lastEventTime > time) {
          (event as any)._lastTime = now;
          return true;
        }
        return false;
      })
    );
  }
};

// Singleton instance of the event bus
export const eventBus = new EventBus();
