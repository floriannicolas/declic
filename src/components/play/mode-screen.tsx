"use client";

import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { availableModes } from "@/engine/modes";
import { applyOutcome, initialScore, type ScoreState } from "@/engine/scoring";
import type { Outcome } from "@/engine/simulator";
import { useProgress } from "@/progress/use-progress";
import type { Camera, Chapter, ModeId } from "@/types";
import { SPRING } from "../motion-tokens";
import { SimulatorMode } from "../simulator/simulator-mode";
import { BackButton } from "./back-button";
import { QuizMode } from "./quiz-mode";
import { ScoreCounter, type Gain } from "./score-counter";
import { StreakBadge } from "./streak-badge";
import { useIsClient } from "./use-is-client";

interface Props {
  chapter: Chapter;
  camera: Camera;
  mode: ModeId;
  onBack: () => void;
}

export type AnswerHandler = (outcome: Outcome) => void;

export function ModeScreen({ chapter, camera, mode, onBack }: Props) {
  const info = availableModes(chapter, camera).find((m) => m.id === mode)!;
  const { submit, record } = useProgress();
  const best = record(chapter.id, mode);
  const isClient = useIsClient();

  const scoreRef = useRef<ScoreState>(initialScore);
  const [score, setScore] = useState<ScoreState>(initialScore);
  const [gain, setGain] = useState<Gain | null>(null);

  const onAnswer = useCallback<AnswerHandler>(
    (outcome) => {
      const result = applyOutcome(scoreRef.current, outcome);
      scoreRef.current = result.state;
      setScore(result.state);
      setGain((g) => ({ id: (g?.id ?? 0) + 1, points: result.gain }));
      submit(chapter.id, mode, result.state.score, result.state.bestStreak);
    },
    [chapter.id, mode, submit],
  );

  return (
    <div className="relative min-h-dvh">
      <motion.div
        layoutId={`mode-panel-${mode}`}
        transition={SPRING.layout}
        className="fixed inset-0 -z-10 rounded-none border-0 bg-surface"
      />

      <header className="fixed inset-x-0 top-0 z-20 border-b border-line/70 bg-surface/85 pt-[var(--safe-top)] backdrop-blur-md">
        <div className="mx-auto flex h-[var(--bar-height)] w-full max-w-5xl items-center gap-3 px-[max(0.75rem,var(--safe-left))]">
          <BackButton onClick={onBack} label="" />
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-fluid-sm font-semibold">{info.title}</span>
            <span className="tabular truncate text-fluid-xs text-muted">
              Record {Math.max(best.bestScore, score.score)} pts
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <StreakBadge streak={score.streak} />
            <ScoreCounter value={score.score} gain={gain} />
          </div>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="mx-auto w-full max-w-5xl px-[max(1rem,var(--safe-left))] pt-[calc(var(--safe-top)+var(--bar-height)+1rem)] pb-[calc(var(--safe-bottom)+6rem)]"
      >
        {isClient &&
          (mode === "simulator" ? (
            <SimulatorMode chapter={chapter} camera={camera} onAnswer={onAnswer} />
          ) : (
            <QuizMode chapter={chapter} camera={camera} mode={mode} onAnswer={onAnswer} />
          ))}
      </motion.main>
    </div>
  );
}
