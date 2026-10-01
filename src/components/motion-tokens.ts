import type { TargetAndTransition, Transition } from "motion/react";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Durations in seconds: 150 to 250 ms for micro interactions, 350 to 500 ms for screens. */
export const DURATION = { micro: 0.2, short: 0.25, screen: 0.42 } as const;

export const SPRING = {
  /** Dial snapping to a detent. */
  dial: { type: "spring", stiffness: 520, damping: 34, mass: 0.6 },
  /** Layout and morphing elements. */
  layout: { type: "spring", stiffness: 380, damping: 36 },
  /** Counters rolling to a new value. */
  counter: { type: "spring", stiffness: 140, damping: 22 },
} satisfies Record<string, Transition>;

/** Rewarding pop on multi keyframe scales ([1, 1.1, 1]): springs only accept two keyframes. */
export const POP: Transition = { duration: 0.32, ease: [0.34, 1.56, 0.64, 1] };

export const micro: Transition = { duration: DURATION.micro, ease: EASE_OUT };

/** Short horizontal shake, 200 ms max. */
export const SHAKE: TargetAndTransition = { x: [0, -8, 7, -5, 3, 0], transition: { duration: 0.2, ease: "easeOut" } };
