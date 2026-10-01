import type { ModeId } from "@/types";

export interface ModeRecord {
  bestScore: number;
  bestStreak: number;
}

export interface ProgressData {
  version: 1;
  /** Keyed by `${chapterId}/${modeId}`. */
  records: Record<string, ModeRecord>;
  cameraId: string | null;
}

/**
 * Persistence boundary. The local implementation below can be swapped for a
 * remote one (shared club scores) without touching the game.
 */
export interface ProgressRepository {
  load(): ProgressData;
  save(data: ProgressData): void;
}

export const emptyProgress: ProgressData = { version: 1, records: {}, cameraId: null };

const STORAGE_KEY = "declic:progress";

export const localRepository: ProgressRepository = {
  load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as ProgressData) : null;
      return parsed?.version === 1 ? parsed : emptyProgress;
    } catch {
      return emptyProgress;
    }
  },
  save(data) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Private browsing or full storage: progress simply lives for the session.
    }
  },
};

export const recordKey = (chapterId: string, mode: ModeId) => `${chapterId}/${mode}`;

/** Small observable store so every component reads the same snapshot. */
export function createProgressStore(repository: ProgressRepository) {
  let data: ProgressData | null = null;
  const listeners = new Set<() => void>();

  const read = () => (data ??= repository.load());
  const write = (next: ProgressData) => {
    data = next;
    repository.save(next);
    listeners.forEach((l) => l());
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: read,
    getServerSnapshot: () => emptyProgress,

    submit(chapterId: string, mode: ModeId, score: number, streak: number) {
      const current = read();
      const key = recordKey(chapterId, mode);
      const previous = current.records[key] ?? { bestScore: 0, bestStreak: 0 };
      if (score <= previous.bestScore && streak <= previous.bestStreak) return;
      write({
        ...current,
        records: {
          ...current.records,
          [key]: { bestScore: Math.max(score, previous.bestScore), bestStreak: Math.max(streak, previous.bestStreak) },
        },
      });
    },

    selectCamera(cameraId: string) {
      write({ ...read(), cameraId });
    },
  };
}

export type ProgressStore = ReturnType<typeof createProgressStore>;
