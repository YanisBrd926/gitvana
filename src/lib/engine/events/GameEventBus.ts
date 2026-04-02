export type GameEvents = {
  'command:executed': { command: string; args: string[]; output: string; success: boolean };
  'state:changed': void;
  'level:loaded': { levelId: string };
  'level:completed': { levelId: string; stars: number };
  'level:failed': { reason: string };
  'hint:requested': void;
  'achievement:unlocked': { id: string; title: string };
};

type EventCallback<T> = (data: T) => void;

export class GameEventBus {
  private listeners = new Map<string, Set<EventCallback<unknown>>>();

  on<K extends keyof GameEvents>(event: K, callback: EventCallback<GameEvents[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(callback as EventCallback<unknown>);
    return () => set.delete(callback as EventCallback<unknown>);
  }

  emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const cb of set) {
        cb(data);
      }
    }
  }

  off<K extends keyof GameEvents>(event: K, callback: EventCallback<GameEvents[K]>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback as EventCallback<unknown>);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new GameEventBus();
