/**
 * Reactive state management system using observables
 * Enables components to react to state changes in a predictable way
 */

import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';
import { createLogger } from '../logger';
import { eventBus } from '../events/event-bus';

const logger = createLogger('Store');

export interface Action<T = any> {
  type: string;
  payload?: T;
  metadata?: Record<string, any>;
}

export type Reducer<S> = (state: S, action: Action) => S;
export type Selector<S, R> = (state: S) => R;
export type Effect<S> = (action: Action, state: S) => void | Promise<void>;

export class Store<S> {
  private state$: BehaviorSubject<S>;
  private reducer: Reducer<S>;
  private effects: Effect<S>[] = [];
  private history: Action[] = [];
  private historyLimit = 100;
  
  constructor(initialState: S, reducer: Reducer<S>) {
    this.state$ = new BehaviorSubject<S>(initialState);
    this.reducer = reducer;
    
    // Log state changes for debugging
    this.state$.subscribe(state => {
      logger.debug('State updated', state);
    });
  }

  /**
   * Get the current state value
   */
  getState(): S {
    return this.state$.getValue();
  }

  /**
   * Get an observable of the entire state
   */
  select(): Observable<S>;
  
  /**
   * Get an observable of a slice of the state using a selector
   */
  select<R>(selector: Selector<S, R>): Observable<R>;
  
  select<R>(selector?: Selector<S, R>): Observable<S | R> {
    if (!selector) {
      return this.state$.asObservable();
    }
    
    return this.state$.pipe(
      map(selector),
      distinctUntilChanged()
    );
  }

  /**
   * Dispatch an action to update the state
   */
  dispatch(action: Action): void {
    logger.debug(`Dispatching action: ${action.type}`, action.payload);
    
    // Add to history
    this.history.unshift(action);
    if (this.history.length > this.historyLimit) {
      this.history.pop();
    }
    
    // Update state
    const currentState = this.state$.getValue();
    const newState = this.reducer(currentState, action);
    this.state$.next(newState);
    
    // Publish to event bus for cross-component communication
    eventBus.publish('store:action', action);
    
    // Run effects
    this.runEffects(action, newState);
  }

  /**
   * Add an effect that runs on specific actions
   */
  addEffect(effect: Effect<S>): () => void {
    this.effects.push(effect);
    return () => {
      this.effects = this.effects.filter(e => e !== effect);
    };
  }

  /**
   * Run all registered effects with the current action and state
   */
  private async runEffects(action: Action, state: S): Promise<void> {
    for (const effect of this.effects) {
      try {
        await effect(action, state);
      } catch (error) {
        logger.error(`Error in effect for action ${action.type}:`, error);
      }
    }
  }

  /**
   * Get action history
   */
  getHistory(): Action[] {
    return [...this.history];
  }
  
  /**
   * Reset the store to a specific state
   * Primarily used for testing
   */
  reset(state: S): void {
    this.state$.next(state);
    this.history = [];
  }
}

/**
 * Create a store with the provided initial state and reducer
 */
export function createStore<S>(
  initialState: S,
  reducer: Reducer<S>
): Store<S> {
  return new Store<S>(initialState, reducer);
}
