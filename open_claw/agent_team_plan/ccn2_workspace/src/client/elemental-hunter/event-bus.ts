// Elemental Hunter - Event Bus
// Centralized event typing for EventEmitter3
// Follows CCN2 pattern: this.events.emit(EventKeys.X, payload)

import { EventEmitter3 } from 'eventemitter3';
import type { EventPayloads, CommandPayloads } from './types';

// Event key constants — use these for emit/subscribe
export const EventKeys = {
  // Game lifecycle
  GAME_START: 'elementalHunter:game.start',
  GAME_OVER: 'elementalHunter:game.over',
  TURN_END: 'elementalHunter:turn.end',

  // Dice
  DICE_RESULT: 'elementalHunter:dice.result',

  // Token
  TOKEN_MOVED: 'elementalHunter:token.moved',
  TOKEN_SELECTED: 'elementalHunter:token.selected',

  // Elements & Combo
  ELEMENT_COLLECTED: 'elementalHunter:element.collected',
  COMBO_TRIGGERED: 'elementalHunter:combo.triggered',

  // Combat
  KICK_OCCURRED: 'elementalHunter:kick.occurred',
  GOAL_REACHED: 'elementalHunter:goal.reached',

  // Artifacts
  EMPTY_TILE_REACHED: 'elementalHunter:empty.tile.reached',
  ARTIFACT_USED: 'elementalHunter:artifact.used',

  // Client errors
  ERROR: 'elementalHunter:error'
} as const;

// Typed EventEmitter wrapper
export class EventBus extends EventEmitter3 {
  // Server → Client events (incoming)
  emit<K extends keyof EventPayloads>(
    event: K,
    payload: EventPayloads[K]
  ): boolean {
    return super.emit(event, payload);
  }

  on<K extends keyof EventPayloads>(
    event: K,
    listener: (payload: EventPayloads[K]) => void,
    context?: any
  ): this {
    return super.on(event, listener, context);
  }

  once<K extends keyof EventPayloads>(
    event: K,
    listener: (payload: EventPayloads[K]) => void,
    context?: any
  ): this {
    return super.once(event, listener, context);
  }

  off<K extends keyof EventPayloads>(
    event: K,
    listener?: (payload: EventPayloads[K]) => void,
    context?: any
  ): this {
    return super.off(event, listener, context);
  }

  // Client → Server commands (outgoing) — aliased for clarity
  emitCommand<C extends keyof CommandPayloads>(
    command: C,
    payload: CommandPayloads[C]
  ): boolean {
    // Commands use different event namespace? In practice, commands are sent via WebSocket
    // This method exists for type safety; actual transport handled by NetworkService
    return super.emit(`command:${command}`, payload);
  }
}

// Singleton instance (optional — can also inject)
export const eventBus = new EventBus();
