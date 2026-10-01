"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Guide, Term } from "@/types";
import { ILLUSTRATIONS } from "../illustrations";
import { SPRING, micro } from "../motion-tokens";

/** Button that opens a guide in a bottom sheet (dialog on large screens). */
export function GuideButton({
  guide,
  vocabulary,
  label,
  compact,
}: {
  guide: Guide;
  vocabulary: readonly Term[];
  label?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.95 }}
        transition={micro}
        aria-label={compact ? `Guide : ${guide.title}` : undefined}
        className={
          compact
            ? "grid size-11 place-items-center rounded-full border border-line bg-surface-2 text-fluid-sm font-semibold text-accent"
            : "inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-accent/50 bg-accent-soft px-4 text-fluid-sm font-semibold text-accent"
        }
      >
        <span aria-hidden>?</span>
        {!compact && (label ?? guide.title)}
      </motion.button>
      <GuideSheet guide={guide} vocabulary={vocabulary} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function GuideSheet({ guide, vocabulary, open, onClose }: { guide: Guide; vocabulary: readonly Term[]; open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const Illustration = guide.illustration ? ILLUSTRATIONS[guide.illustration] : null;
  const terms = (guide.terms ?? []).map((id) => vocabulary.find((t) => t.id === id)).filter((t): t is Term => !!t);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={guide.title}>
          <motion.button
            type="button"
            aria-label="Fermer le guide"
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={micro}
          />
          <motion.section
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%", transition: { duration: 0.25, ease: "easeIn" } }}
            transition={SPRING.layout}
            className="relative flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-line bg-surface sm:rounded-3xl"
          >
            <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
              <h2 className="text-fluid-lg font-semibold">{guide.title}</h2>
              <button type="button" onClick={onClose} className="grid size-11 place-items-center rounded-full text-muted hover:text-text" aria-label="Fermer">
                ✕
              </button>
            </header>
            <div className="flex flex-col gap-4 overflow-y-auto px-5 pt-4 pb-[max(1.25rem,var(--safe-bottom))]">
              {Illustration && <Illustration />}
              {guide.paragraphs.map((p) => (
                <p key={p} className="text-fluid-sm leading-relaxed">
                  {p}
                </p>
              ))}
              {terms.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-fluid-xs font-semibold uppercase tracking-wider text-accent">Rappels de vocabulaire</h3>
                  <dl className="flex flex-col gap-2">
                    {terms.map((t) => (
                      <div key={t.id} className="rounded-xl bg-surface-2 p-3 text-fluid-sm leading-relaxed">
                        <dt className="font-semibold">{t.term}</dt>
                        <dd className="text-text/85">{t.definition}</dd>
                        {t.pitfall && <dd className="mt-1 text-text/70">Piège : {t.pitfall}</dd>}
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
