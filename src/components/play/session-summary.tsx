"use client";

import { motion } from "motion/react";
import type { ScoreState } from "@/engine/scoring";
import { EASE_OUT, POP, micro } from "../motion-tokens";
import type { SessionProgress } from "./mode-screen";

export function SessionSummary({
  score,
  previousBest,
  progress,
  onReplay,
  onBack,
}: {
  score: ScoreState;
  previousBest: number;
  progress: SessionProgress | null;
  onReplay: () => void;
  onBack: () => void;
}) {
  const newRecord = score.score > previousBest;
  const stats = [
    { label: "Score", value: `${score.score} pts` },
    { label: "Meilleure série", value: String(score.bestStreak) },
    { label: progress ? `${progress.unit.plural[0].toUpperCase()}${progress.unit.plural.slice(1)} revues` : "Revues", value: progress ? String(progress.total) : "" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 py-6 text-center"
    >
      <p className="text-fluid-xs font-medium uppercase tracking-[0.2em] text-accent">Session terminée</p>
      <h2 className="text-fluid-2xl font-semibold leading-tight">
        {newRecord ? "Nouveau record !" : "Bien joué !"}
      </h2>
      {newRecord && previousBest > 0 && (
        <motion.p initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: [0.8, 1.08, 1], opacity: 1 }} transition={{ ...POP, delay: 0.3 }} className="tabular rounded-full bg-accent-soft px-4 py-1.5 text-fluid-sm text-accent">
          Ancien record : {previousBest} pts
        </motion.p>
      )}
      <ul className="grid w-full grid-cols-3 gap-2">
        {stats.map((stat, i) => (
          <motion.li
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.3, ease: EASE_OUT }}
            className="flex flex-col gap-1 rounded-2xl border border-line bg-surface-2 px-2 py-4"
          >
            <span className="tabular text-fluid-xl font-semibold">{stat.value}</span>
            <span className="text-fluid-xs text-muted">{stat.label}</span>
          </motion.li>
        ))}
      </ul>
      <p className="max-w-prose text-fluid-sm text-muted">
        Chaque élément est passé une fois, dans un ordre aléatoire. Rejoue pour un nouveau tirage.
      </p>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <motion.button
          type="button"
          onClick={onReplay}
          whileTap={{ scale: 0.97 }}
          transition={micro}
          className="min-h-12 rounded-full bg-accent px-8 text-fluid-base font-semibold text-accent-ink"
        >
          Rejouer
        </motion.button>
        <motion.button
          type="button"
          onClick={onBack}
          whileTap={{ scale: 0.97 }}
          transition={micro}
          className="min-h-12 rounded-full border border-line px-8 text-fluid-base font-semibold"
        >
          Retour au chapitre
        </motion.button>
      </div>
    </motion.section>
  );
}
