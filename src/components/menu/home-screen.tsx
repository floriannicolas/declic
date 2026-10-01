"use client";

import { motion } from "motion/react";
import { chapters } from "@/data/chapters";
import { photoCredits } from "@/data/photo-credits";
import { useCamera } from "@/progress/use-progress";
import { micro } from "../motion-tokens";

export function HomeScreen({ onOpen, onCamera3d }: { onOpen: (chapterId: string) => void; onCamera3d: () => void }) {
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

      {camera.parts && camera.parts.length > 0 && (
        <section aria-labelledby="boitier" className="flex flex-col gap-3">
          <h2 id="boitier" className="text-fluid-sm font-medium text-muted">
            Mon boîtier
          </h2>
          <motion.button
            type="button"
            onClick={onCamera3d}
            whileTap={{ scale: 0.98 }}
            transition={micro}
            className="group flex w-full items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:border-accent/50 sm:p-5"
          >
            <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-accent text-fluid-sm font-semibold text-accent">
              3D
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-fluid-lg font-semibold leading-snug">
                Le {camera.model} en 3D
              </span>
              <span className="text-fluid-sm text-muted">
                Fais tourner l&apos;appareil et découvre ses {camera.parts.length} commandes, une par une.
              </span>
            </span>
            <span aria-hidden className="ml-auto text-muted transition-transform group-hover:translate-x-1">
              →
            </span>
          </motion.button>
        </section>
      )}

      {Object.keys(photoCredits).length > 0 && (
        <details className="group rounded-2xl border border-line bg-surface p-4 text-fluid-xs text-muted">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-fluid-sm text-text">
            Crédits photos
            <span aria-hidden className="transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <ul className="mt-2 flex flex-col gap-2 leading-relaxed">
            {Object.entries(photoCredits).map(([file, c]) => (
              <li key={file}>
                {c.usage} :{" "}
                <a href={c.sourceUrl} className="underline decoration-line underline-offset-2 hover:text-text" target="_blank" rel="noreferrer">
                  photo de {c.author}
                </a>
                ,{" "}
                <a href={c.licenseUrl} className="underline decoration-line underline-offset-2 hover:text-text" target="_blank" rel="noreferrer">
                  {c.license}
                </a>
                . {c.changes}
              </li>
            ))}
          </ul>
        </details>
      )}

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
