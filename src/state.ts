import { SETTINGS, type OutfitId } from './config';

export type Column = 'todo' | 'progress' | 'done';
export interface Task { id: string; text: string; column: Column }
export interface Idea { id: string; text: string }
export interface DemoState {
  version: 1;
  outfit: OutfitId;
  note: string;
  ideas: Idea[];
  tasks: Task[];
  timer: { remaining: number; endAt: number | null };
}

export const freshState = (): DemoState => ({
  version: 1, outfit: 'tailored', note: '', ideas: [], tasks: [],
  timer: { remaining: SETTINGS.focusSeconds, endAt: null },
});

let storageAvailable = true;
export function readState(): DemoState {
  try {
    const raw = localStorage.getItem(SETTINGS.storageKey);
    if (!raw) return freshState();
    const saved = JSON.parse(raw);
    const fallback = freshState();
    if (saved.version !== 1) return fallback;
    return {
      ...fallback,
      outfit: ['tailored', 'techwear', 'mythic'].includes(saved.outfit) ? saved.outfit : fallback.outfit,
      note: typeof saved.note === 'string' ? saved.note.slice(0, 10000) : '',
      ideas: Array.isArray(saved.ideas) ? saved.ideas.filter((x: Idea) => x && typeof x.id === 'string' && typeof x.text === 'string').slice(0, 100) : [],
      tasks: Array.isArray(saved.tasks) ? saved.tasks.filter((x: Task) => x && typeof x.id === 'string' && typeof x.text === 'string' && ['todo', 'progress', 'done'].includes(x.column)).slice(0, 100) : [],
      timer: saved.timer && Number.isFinite(saved.timer.remaining) && saved.timer.remaining >= 0 && saved.timer.remaining <= SETTINGS.focusSeconds && (saved.timer.endAt === null || Number.isFinite(saved.timer.endAt))
        ? saved.timer : fallback.timer,
    };
  } catch {
    // A malformed or inaccessible save never prevents entering the demo.
    return freshState();
  }
}

export const state = readState();
export function saveState(): boolean {
  try { localStorage.setItem(SETTINGS.storageKey, JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; }
  document.dispatchEvent(new CustomEvent('aether:storage', { detail: storageAvailable }));
  return storageAvailable;
}

export function secondsRemaining(): number {
  return state.timer.endAt === null ? state.timer.remaining : Math.max(0, Math.ceil((state.timer.endAt - Date.now()) / 1000));
}

export function toggleTimer(): void {
  if (state.timer.endAt !== null) {
    state.timer.remaining = secondsRemaining();
    state.timer.endAt = null;
  } else {
    if (state.timer.remaining <= 0) state.timer.remaining = SETTINGS.focusSeconds;
    state.timer.endAt = Date.now() + state.timer.remaining * 1000;
  }
  saveState();
}

export function resetTimer(): void {
  state.timer = { remaining: SETTINGS.focusSeconds, endAt: null };
  saveState();
}

export function resetData(): void { Object.assign(state, freshState()); saveState(); }
export const newId = () => crypto.randomUUID();
