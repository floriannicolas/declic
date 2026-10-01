"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createSession, roundWeight, type QuizModeId } from "@/engine/rounds";
import { DURATION, EASE_OUT } from "../motion-tokens";
import { ActionBar } from "./action-bar";
import { ChoiceQuestionView } from "./choice-question";
import { GuideButton } from "./guide-sheet";
import { MatchingRoundView } from "./matching-round";
import type { ModeProps } from "./mode-screen";

export function QuizMode({ chapter, camera, mode, onAnswer, onProgress, onComplete }: ModeProps & { mode: QuizModeId }) {
  const [session] = useState(() => createSession(mode, chapter, camera));
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  const round = session.rounds[index];
  const isLast = index === session.rounds.length - 1;
  const done = session.rounds.slice(0, index).reduce((sum, r) => sum + roundWeight(r), 0) + (finished ? roundWeight(round) : 0);

  useEffect(() => {
    onProgress({ done, total: session.total, unit: session.unit });
  }, [done, session, onProgress]);

  const advance = () => {
    if (isLast) return onComplete();
    setFinished(false);
    setIndex((i) => i + 1);
  };

  return (
    <>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: DURATION.screen, ease: EASE_OUT }}
          className="mx-auto w-full max-w-2xl"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="tabular text-fluid-xs font-medium uppercase tracking-[0.2em] text-muted">
              {round.kind === "matching" ? "Association" : "Question"} {index + 1} sur {session.rounds.length}
            </p>
            {mode === "stops" && chapter.guides?.stops && <GuideButton guide={chapter.guides.stops} vocabulary={chapter.vocabulary} label="Aide-mémoire" />}
          </div>
          {round.kind === "choice" ? (
            <ChoiceQuestionView
              question={round.question}
              onAnswered={(correct) => {
                onAnswer(correct ? "correct" : "wrong");
                setFinished(true);
              }}
            />
          ) : (
            <MatchingRoundView
              round={round.round}
              onLink={(correct) => onAnswer(correct ? "correct" : "wrong")}
              onComplete={() => setFinished(true)}
            />
          )}
        </motion.div>
      </AnimatePresence>
      <ActionBar label={isLast ? "Voir le bilan" : "Question suivante"} onClick={advance} visible={finished} />
    </>
  );
}
