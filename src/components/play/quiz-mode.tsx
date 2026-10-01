"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { createRoundSource, type QuizModeId, type Round } from "@/engine/rounds";
import type { Camera, Chapter } from "@/types";
import { DURATION, EASE_OUT } from "../motion-tokens";
import { ActionBar } from "./action-bar";
import { ChoiceQuestionView } from "./choice-question";
import { MatchingRoundView } from "./matching-round";
import type { AnswerHandler } from "./mode-screen";

export function QuizMode({
  chapter,
  camera,
  mode,
  onAnswer,
}: {
  chapter: Chapter;
  camera: Camera;
  mode: QuizModeId;
  onAnswer: AnswerHandler;
}) {
  const [next] = useState(() => createRoundSource(mode, chapter, camera));
  const [round, setRound] = useState<{ n: number; round: Round }>(() => ({ n: 1, round: next() }));
  const [finished, setFinished] = useState(false);

  const advance = () => {
    setFinished(false);
    setRound((r) => ({ n: r.n + 1, round: next() }));
  };

  return (
    <>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={round.n}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: DURATION.screen, ease: EASE_OUT }}
          className="mx-auto w-full max-w-2xl"
        >
          <p className="tabular mb-3 text-fluid-xs font-medium uppercase tracking-[0.2em] text-muted">
            {round.round.kind === "matching" ? "Association" : "Question"} {round.n}
          </p>
          {round.round.kind === "choice" ? (
            <ChoiceQuestionView
              question={round.round.question}
              onAnswered={(correct) => {
                onAnswer(correct ? "correct" : "wrong");
                setFinished(true);
              }}
            />
          ) : (
            <MatchingRoundView
              round={round.round.round}
              onLink={(correct) => onAnswer(correct ? "correct" : "wrong")}
              onComplete={() => setFinished(true)}
            />
          )}
        </motion.div>
      </AnimatePresence>
      <ActionBar label="Question suivante" onClick={advance} visible={finished} />
    </>
  );
}
