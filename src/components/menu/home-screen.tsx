"use client";

import { motion } from "motion/react";
import { chapters } from "@/data/chapters";
import { useCamera } from "@/progress/use-progress";
import { micro } from "../motion-tokens";

export function HomeScreen({ onOpen }: { onOpen: (chapterId: string) => void }) {
  const { camera, cameras, select } = useCamera();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-[max(1rem,var(--safe-left))] pt-[calc(var(--safe-top)+2.5rem)] pb-[calc(var(--safe-bottom)+2rem)]">
      <header className="flex flex-col gap-2">
        <p className="text-fluid-xs font-medium uppercase tracking-[0.2em] text-accent">Club photo</p>
        <h1 className="text-fluid-2xl font-semibold tracking-tight">Déclic</h1>
        <p className="max-w-prose text-fluid-base text-muted">
          Révise les cours chapitre par chapitre, avec ton {camera.brand} {camera.model} en main.
        </p>
      </header>

      <section aria-labelledby="chapitres" className="flex flex-col gap-3">
        <h2 id="chapitres" className="text-fluid-sm font-medium text-muted">
          Chapitres
        </h2>
        <ul className="flex flex-col gap-3">
          {chapters.map((chapter) => (
            <li key={chapter.id}>
              <motion.button
                type="button"
                onClick={() => onOpen(chapter.id)}
                whileTap={{ scale: 0.98 }}
                transition={micro}
                className="group flex w-full items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:border-accent/50 sm:p-5"
              >
                <span className="tabular grid size-12 shrink-0 place-items-center rounded-full border-2 border-accent text-fluid-lg font-semibold text-accent">
                  {chapter.number}
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-fluid-lg font-semibold leading-snug">{chapter.title}</span>
                  <span className="text-fluid-sm text-muted">{chapter.summary}</span>
                </span>
                <span aria-hidden className="ml-auto text-muted transition-transform group-hover:translate-x-1">
                  →
                </span>
              </motion.button>
            </li>
          ))}
        </ul>
      </section>

      {cameras.length > 1 && (
        <section aria-labelledby="reglages" className="flex flex-col gap-3">
          <h2 id="reglages" className="text-fluid-sm font-medium text-muted">
            Réglages
          </h2>
          <label className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4">
            <span className="text-fluid-sm">Mon boîtier</span>
            <select
              value={camera.id}
              onChange={(e) => select(e.target.value)}
              className="min-h-11 rounded-lg border border-line bg-surface-2 px-3 text-fluid-base"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.brand} {c.model}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}
    </main>
  );
}
