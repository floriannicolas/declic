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
import { SessionSummary } from "./session-summary";
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

export interface SessionProgress {
  done: number;
  total: number;
  unit: { singular: string; plural: string };
}

/** Contract between the screen and a mode: score events, progress, end of session. */
export interface ModeProps {
  chapter: Chapter;
  camera: Camera;
  onAnswer: AnswerHandler;
  onProgress: (progress: SessionProgress) => void;
  onComplete: () => void;
}

export function ModeScreen({ chapter, camera, mode, onBack }: Props) {
  const info = availableModes(chapter, camera).find((m) => m.id === mode)!;
  const { submit, record } = useProgress();
  const best = record(chapter.id, mode);
  const isClient = useIsClient();

  const scoreRef = useRef<ScoreState>(initialScore);
  const [score, setScore] = useState<ScoreState>(initialScore);
  const [gain, setGain] = useState<Gain | null>(null);
  const [progress, setProgress] = useState<SessionProgress | null>(null);
  // The record is captured at the first answer: before that, the store may still hold its prerender snapshot.
  const [session, setSession] = useState<{ id: number; complete: boolean; previousBest: number | null }>({
    id: 1,
    complete: false,
    previousBest: null,
  });

  const replay = () => {
    scoreRef.current = initialScore;
    setScore(initialScore);
    setGain(null);
    setProgress(null);
    setSession((s) => ({ id: s.id + 1, complete: false, previousBest: null }));
    window.scrollTo({ top: 0 });
  };

  const complete = useCallback(() => {
    setSession((s) => ({ ...s, complete: true }));
    window.scrollTo({ top: 0 });
  }, []);

  const onAnswer = useCallback<AnswerHandler>(
    (outcome) => {
      const before = record(chapter.id, mode).bestScore;
      setSession((s) => (s.previousBest === null ? { ...s, previousBest: before } : s));
      const result = applyOutcome(scoreRef.current, outcome);
      scoreRef.current = result.state;
      setScore(result.state);
      setGain((g) => ({ id: (g?.id ?? 0) + 1, points: result.gain }));
      submit(chapter.id, mode, result.state.score, result.state.bestStreak);
    },
    [chapter.id, mode, record, submit],
  );

  const modeProps: ModeProps = { chapter, camera, onAnswer, onProgress: setProgress, onComplete: complete };

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
              {progress && `${progress.done} / ${progress.total} ${progress.unit.plural} · `}
              Record {Math.max(best.bestScore, score.score)} pts
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <StreakBadge streak={score.streak} />
            <ScoreCounter value={score.score} gain={gain} />
          </div>
        </div>
        {progress && (
          <div
            role="progressbar"
            aria-label="Progression de la session"
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.done}
            className="absolute inset-x-0 -bottom-px h-[3px] bg-line/60"
          >
            <motion.div
              className="h-full origin-left bg-accent"
              initial={false}
              animate={{ scaleX: progress.total ? progress.done / progress.total : 0 }}
              transition={SPRING.layout}
            />
          </div>
        )}
      </header>

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="mx-auto w-full max-w-5xl px-[max(1rem,var(--safe-left))] pt-[calc(var(--safe-top)+var(--bar-height)+1rem)] pb-[calc(var(--safe-bottom)+6rem)]"
      >
        {isClient && session.complete && (
          <SessionSummary
            score={score}
            previousBest={session.previousBest ?? 0}
            progress={progress}
            onReplay={replay}
            onBack={onBack}
          />
        )}
        {isClient &&
          !session.complete &&
          (mode === "simulator" ? (
            <SimulatorMode key={session.id} {...modeProps} />
          ) : (
            <QuizMode key={session.id} mode={mode} {...modeProps} />
          ))}
      </motion.main>
    </div>
  );
}
