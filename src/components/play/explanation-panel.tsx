"use client";

import { motion } from "motion/react";
import type { Outcome } from "@/engine/simulator";
import type { Explanation } from "@/types";
import { DURATION, EASE_OUT } from "../motion-tokens";

const HEADINGS: Record<Outcome, { text: string; tone: string }> = {
  correct: { text: "Bonne réponse", tone: "text-good" },
  partial: { text: "Presque", tone: "text-accent" },
  wrong: { text: "Pas cette fois", tone: "text-bad" },
};

/** Slides up, then highlights the keyword once the text has settled. */
export function ExplanationPanel({
  explanation,
  outcome,
  children,
}: {
  explanation: Explanation;
  outcome: Outcome;
  children?: React.ReactNode;
}) {
  const heading = HEADINGS[outcome];
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.short + 0.1, ease: EASE_OUT }}
      className="flex flex-col gap-3 rounded-2xl border border-line bg-bg/60 p-4 sm:p-5"
      aria-live="polite"
    >
      <h3 className={`text-fluid-base font-semibold ${heading.tone}`}>{heading.text}</h3>
      {children}
      <p className="text-fluid-base leading-relaxed">
        <Highlighted text={explanation.text} keyword={explanation.keyword} />
      </p>
      {explanation.extra && (
        <div className="rounded-xl bg-surface-2 p-3">
          <p className="text-fluid-xs font-semibold uppercase tracking-wider text-accent">{explanation.extra.title}</p>
          <p className="mt-1 text-fluid-sm leading-relaxed">{explanation.extra.text}</p>
        </div>
      )}
    </motion.section>
  );
}

export function Highlighted({ text, keyword }: { text: string; keyword?: string }) {
  const at = keyword ? text.toLowerCase().indexOf(keyword.toLowerCase()) : -1;
  if (!keyword || at === -1) return <>{text}</>;
  const end = at + keyword.length;
  return (
    <>
      {text.slice(0, at)}
      <motion.mark
        className="rounded-sm font-semibold [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
        style={{ backgroundImage: "linear-gradient(var(--accent-soft), var(--accent-soft))", backgroundRepeat: "no-repeat" }}
        initial={{ backgroundSize: "0% 100%", color: "var(--text)" }}
        animate={{ backgroundSize: "100% 100%", color: "var(--accent)" }}
        transition={{ delay: 0.35, duration: 0.4, ease: EASE_OUT }}
      >
        {text.slice(at, end)}
      </motion.mark>
      {text.slice(end)}
    </>
  );
}
