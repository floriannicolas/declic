"use client";

import { motion } from "motion/react";
import { useState } from "react";
import type { ChoiceQuestion } from "@/types";
import { POP, SHAKE } from "../motion-tokens";
import { ExplanationPanel } from "./explanation-panel";

const LETTERS = ["A", "B", "C", "D"];

export function ChoiceQuestionView({
  question,
  onAnswered,
}: {
  question: ChoiceQuestion;
  onAnswered: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;
  const correct = selected === question.answerId;

  const choose = (id: string) => {
    if (answered) return;
    setSelected(id);
    onAnswered(id === question.answerId);
  };

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-fluid-xl font-semibold leading-snug text-balance">{question.prompt}</h2>
      <ul className="flex flex-col gap-2.5">
        {question.options.map((option, i) => {
          const isAnswer = option.id === question.answerId;
          const isSelected = option.id === selected;
          const state = !answered ? "idle" : isAnswer ? "right" : isSelected ? "wrong" : "dim";
          return (
            <li key={option.id}>
              <motion.button
                type="button"
                onClick={() => choose(option.id)}
                disabled={answered}
                animate={
                  state === "right" && isSelected
                    ? { scale: [1, 1.035, 1], transition: POP }
                    : state === "wrong"
                      ? SHAKE
                      : { scale: 1 }
                }
                whileTap={answered ? undefined : { scale: 0.98 }}
                className={`flex min-h-13 w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-fluid-base transition-colors duration-200 ${
                  {
                    idle: "border-line bg-surface-2 hover:border-accent/60",
                    right: "border-good bg-good-soft",
                    wrong: "border-bad bg-bad-soft",
                    dim: "border-line bg-surface-2 opacity-50",
                  }[state]
                }`}
              >
                <span
                  aria-hidden
                  className={`tabular mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border text-fluid-xs font-semibold ${
                    state === "right" ? "border-good bg-good text-bg" : state === "wrong" ? "border-bad bg-bad text-bg" : "border-line text-muted"
                  }`}
                >
                  {state === "right" ? "✓" : state === "wrong" ? "✕" : LETTERS[i]}
                </span>
                <span>{option.text}</span>
              </motion.button>
            </li>
          );
        })}
      </ul>
      {answered && <ExplanationPanel explanation={question.explanation} outcome={correct ? "correct" : "wrong"} />}
    </div>
  );
}
