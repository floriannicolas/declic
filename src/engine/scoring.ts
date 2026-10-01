import type { Outcome } from "./simulator";

export const BASE_POINTS = 10;
export const PARTIAL_POINTS = 5;

export interface ScoreState {
  score: number;
  streak: number;
  bestStreak: number;
}

export const initialScore: ScoreState = { score: 0, streak: 0, bestStreak: 0 };

/** x1, then x1.5 from 3 right answers in a row, x2 from 5. */
export function multiplier(streak: number): number {
  if (streak >= 5) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

export function applyOutcome(state: ScoreState, outcome: Outcome): { state: ScoreState; gain: number } {
  if (outcome === "correct") {
    const streak = state.streak + 1;
    const gain = Math.round(BASE_POINTS * multiplier(streak));
    return { gain, state: { score: state.score + gain, streak, bestStreak: Math.max(state.bestStreak, streak) } };
  }
  const gain = outcome === "partial" ? PARTIAL_POINTS : 0;
  return { gain, state: { ...state, score: state.score + gain, streak: 0 } };
}
