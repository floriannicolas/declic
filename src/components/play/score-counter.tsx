"use client";

import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";
import { SPRING } from "../motion-tokens";

export interface Gain {
  id: number;
  points: number;
}

/** Score rolling up to its new value, with the points just earned floating away. */
export function ScoreCounter({ value, gain }: { value: number; gain: Gain | null }) {
  const spring = useSpring(value, SPRING.counter);
  const display = useTransform(spring, (v) => Math.round(v).toString());

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <div className="relative flex items-baseline gap-1" aria-live="polite">
      <span className="sr-only">Score : {value} points</span>
      <motion.span aria-hidden className="tabular text-fluid-lg font-semibold">
        {display}
      </motion.span>
      <span aria-hidden className="text-fluid-xs text-muted">
        pts
      </span>
      <AnimatePresence>
        {gain && gain.points > 0 && (
          <motion.span
            key={gain.id}
            aria-hidden
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: [0, 1, 1, 0], y: -18 }}
            transition={{ duration: 0.9, times: [0, 0.15, 0.7, 1], ease: "easeOut" }}
            className="tabular pointer-events-none absolute -top-1 right-0 text-fluid-sm font-semibold text-good"
          >
            +{gain.points}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
