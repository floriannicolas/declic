"use client";

import { motion } from "motion/react";
import type { Chapter } from "@/types";
import { BackButton } from "../play/back-button";
import { LearnMore } from "../play/explanation-panel";

export function GlossaryScreen({ chapter, onBack }: { chapter: Chapter; onBack: () => void }) {
  const terms = [...chapter.vocabulary].sort((a, b) => a.term.localeCompare(b.term, "fr"));
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-[max(1rem,var(--safe-left))] pt-[calc(var(--safe-top)+1rem)] pb-[calc(var(--safe-bottom)+2rem)]">
      <BackButton onClick={onBack} label={`Chapitre ${chapter.number}`} />
      <header className="flex flex-col gap-2">
        <p className="text-fluid-xs font-medium uppercase tracking-[0.2em] text-accent">Lexique</p>
        <h1 className="text-fluid-xl font-semibold leading-tight">{chapter.title}</h1>
        <p className="text-fluid-sm text-muted">{terms.length} notions. Ouvre « En savoir plus » pour les explications détaillées et les illustrations.</p>
      </header>
      <ul className="flex flex-col gap-3">
        {terms.map((t, i) => (
          <motion.li
            key={t.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 10) * 0.03, duration: 0.25 }}
            className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4"
          >
            <h2 className="text-fluid-base font-semibold text-accent">{t.term}</h2>
            <p className="text-fluid-sm leading-relaxed">{t.definition}</p>
            {t.pitfall && (
              <p className="rounded-xl bg-surface-2 p-3 text-fluid-sm leading-relaxed">
                <span className="font-semibold text-accent">Piège : </span>
                {t.pitfall}
              </p>
            )}
            {t.more && <LearnMore more={t.more} />}
          </motion.li>
        ))}
      </ul>
    </main>
  );
}
