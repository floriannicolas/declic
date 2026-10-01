"use client";

import { motion } from "motion/react";
import { availableModes } from "@/engine/modes";
import { useProgress } from "@/progress/use-progress";
import type { Camera, Chapter, ModeId } from "@/types";
import { BackButton } from "../play/back-button";
import { ModeIcon } from "../play/mode-icon";
import { SPRING } from "../motion-tokens";

interface Props {
  chapter: Chapter;
  camera: Camera;
  onBack: () => void;
  onPlay: (mode: ModeId) => void;
  onGlossary: () => void;
}

export function ChapterScreen({ chapter, camera, onBack, onPlay, onGlossary }: Props) {
  const { record } = useProgress();
  const modes = availableModes(chapter, camera);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-[max(1rem,var(--safe-left))] pt-[calc(var(--safe-top)+1rem)] pb-[calc(var(--safe-bottom)+2rem)]">
      <BackButton onClick={onBack} label="Chapitres" />
      <header className="flex flex-col gap-2">
        <p className="tabular text-fluid-xs font-medium uppercase tracking-[0.2em] text-accent">Chapitre {chapter.number}</p>
        <h1 className="text-fluid-xl font-semibold leading-tight tracking-tight">{chapter.title}</h1>
      </header>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {modes.map((mode, i) => {
          const best = record(chapter.id, mode.id);
          return (
            <li key={mode.id} className={i === 0 ? "sm:col-span-2" : undefined}>
              <motion.button
                type="button"
                onClick={() => onPlay(mode.id)}
                whileTap={{ scale: 0.98 }}
                className="relative flex min-h-28 w-full flex-col gap-3 p-4 text-left sm:p-5"
              >
                <motion.span
                  layoutId={`mode-panel-${mode.id}`}
                  transition={SPRING.layout}
                  className="absolute inset-0 rounded-2xl border border-line bg-surface"
                />
                <span className="relative flex items-center gap-3">
                  <ModeIcon mode={mode.id} className="size-6 text-accent" />
                  <span className="text-fluid-lg font-semibold">{mode.title}</span>
                </span>
                <span className="relative text-fluid-sm text-muted">{mode.description}</span>
                <span className="tabular relative mt-auto text-fluid-xs text-muted">
                  {best.bestScore > 0
                    ? `Record : ${best.bestScore} pts · meilleure série ${best.bestStreak}`
                    : "Pas encore joué"}
                </span>
              </motion.button>
            </li>
          );
        })}
      </ul>

      {chapter.vocabulary.length > 0 && (
        <motion.button
          type="button"
          onClick={onGlossary}
          whileTap={{ scale: 0.98 }}
          className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-dashed border-line px-4 text-left transition-colors hover:border-accent/60 sm:px-5"
        >
          <span className="flex flex-col">
            <span className="text-fluid-base font-semibold">Lexique du chapitre</span>
            <span className="text-fluid-xs text-muted">{chapter.vocabulary.length} notions expliquées et illustrées, à relire sans jouer</span>
          </span>
          <span aria-hidden className="text-muted">→</span>
        </motion.button>
      )}
    </main>
  );
}
