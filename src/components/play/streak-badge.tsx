"use client";

import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { multiplier } from "@/engine/scoring";
import { POP } from "../motion-tokens";

const PARTICLES = 6;

/**
 * Neutral below 3, amber and pulsing from 3, hot with sparks from 5.
 * A broken streak drops visibly but briefly.
 */
export function StreakBadge({ streak }: { streak: number }) {
  const [scope, animate] = useAnimate();
  const previous = useRef(streak);
  const reduced = useReducedMotion();
  const level = streak >= 5 ? 2 : streak >= 3 ? 1 : 0;
  const factor = multiplier(streak);

  useEffect(() => {
    const before = previous.current;
    previous.current = streak;
    if (!scope.current || reduced) return;
    if (streak > before) animate(scope.current, { scale: [1, 1.18, 1] }, POP);
    else if (streak === 0 && before > 0) animate(scope.current, { scale: [1, 0.86, 1], y: [0, 3, 0] }, { duration: 0.35, ease: "easeOut" });
  }, [streak, animate, scope, reduced]);

  const tone = ["border-line text-muted", "border-accent text-accent bg-accent-soft", "border-hot text-hot bg-[rgb(255_122_26/0.16)]"][level];

  return (
    <div className="relative">
      <motion.div
        ref={scope}
        className={`tabular relative flex h-9 items-center gap-1.5 rounded-full border px-3 text-fluid-sm font-semibold transition-colors duration-200 ${tone}`}
        aria-label={`Série de ${streak}, multiplicateur ${factor}`}
      >
        {level > 0 && !reduced && (
          <motion.span
            aria-hidden
            className={`absolute inset-0 rounded-full ${level === 2 ? "bg-hot/25" : "bg-accent/20"}`}
            animate={{ opacity: [0.2, 0.9, 0.2], scale: [1, 1.08, 1] }}
            transition={{ duration: level === 2 ? 0.8 : 1.3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <span aria-hidden className="relative text-fluid-xs font-medium opacity-80">
          Série
        </span>
        <span className="relative">{streak}</span>
        {factor > 1 && (
          <span className="relative text-fluid-xs opacity-80">x{factor.toLocaleString("fr-FR")}</span>
        )}
      </motion.div>

      <AnimatePresence>
        {level > 0 && !reduced && (
          <motion.span key={streak} aria-hidden className="pointer-events-none absolute inset-0" exit={{ opacity: 0 }}>
            {Array.from({ length: PARTICLES }, (_, i) => {
              const angle = (i / PARTICLES) * Math.PI * 2 + streak;
              return (
                <motion.span
                  key={i}
                  className={`absolute top-1/2 left-1/2 size-1.5 rounded-full ${level === 2 ? "bg-hot" : "bg-accent"}`}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: Math.cos(angle) * 26, y: Math.sin(angle) * 18, opacity: 0, scale: 0.4 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                />
              );
            })}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
