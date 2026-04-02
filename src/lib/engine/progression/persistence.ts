export interface GameSave {
  version: number;
  completedLevels: number;
  levelIndex: number;
  levelStars: Record<string, number>; // levelId -> stars earned
  totalStars: number;
}

const SAVE_KEY = 'gitvana-save';
const SAVE_VERSION = 1;

export function saveProgress(data: GameSave): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, version: SAVE_VERSION }));
  } catch {
    // localStorage may be unavailable or full
  }
}

export function loadProgress(): GameSave | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data: GameSave = JSON.parse(raw);
    if (typeof data.version !== 'number') return null;
    return data;
  } catch {
    return null;
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}

const NAME_KEY = 'gitvana-player-name';

export function savePlayerName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // localStorage may be unavailable or full
  }
}

export function getPlayerName(): string {
  try {
    return localStorage.getItem(NAME_KEY) || 'Anonymous Monk';
  } catch {
    return 'Anonymous Monk';
  }
}
