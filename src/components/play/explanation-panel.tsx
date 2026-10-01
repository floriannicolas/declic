"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Outcome } from "@/engine/simulator";
import type { Deepening, Explanation } from "@/types";
import { ZoomableIllustration } from "../illustrations/zoomable";
import { DURATION, EASE_OUT, micro } from "../motion-tokens";

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
      {explanation.more && <LearnMore more={explanation.more} title={explanation.moreTitle} />}
    </motion.section>
  );
}

/** Collapsed by default so the game keeps its pace; one tap opens details and illustration. */
export function LearnMore({ more, title }: { more: Deepening; title?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1 border-t border-line pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-1 text-left text-fluid-sm font-semibold text-accent"
      >
        <span>{title ? `En savoir plus : ${title}` : "En savoir plus"}</span>
        <motion.span aria-hidden animate={{ rotate: open ? 180 : 0 }} transition={micro} className="text-lg leading-none">
          ⌄
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
            transition={{ duration: DURATION.short, ease: EASE_OUT }}
            className="flex flex-col gap-3 pt-2"
          >
            {more.illustration && <ZoomableIllustration id={more.illustration} />}
            {more.paragraphs.map((p) => (
              <p key={p} className="text-fluid-sm leading-relaxed text-text/90">
                {p}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
