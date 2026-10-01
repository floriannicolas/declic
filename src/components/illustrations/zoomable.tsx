"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import type { IllustrationId } from "@/types";
import { SPRING, micro } from "../motion-tokens";
import { ILLUSTRATIONS } from ".";

/**
 * Inline illustration that grows into a full screen view on tap. Taps on its
 * own controls (buttons, inputs) keep working and do not open the zoom.
 */
export function ZoomableIllustration({ id }: { id: IllustrationId }) {
  const [open, setOpen] = useState(false);
  const layoutId = useId();
  const Illustration = ILLUSTRATIONS[id];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openUnlessControl = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, select, [role=slider]")) return;
    setOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 self-end rounded-full px-3 text-fluid-xs font-medium text-muted transition-colors hover:text-text"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
          Agrandir
        </button>
        <motion.div layoutId={layoutId} transition={SPRING.layout} onClick={openUnlessControl} className="cursor-zoom-in rounded-xl">
          <Illustration />
        </motion.div>
      </div>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="zoom"
                role="dialog"
                aria-modal="true"
                aria-label="Illustration agrandie"
                className="fixed inset-0 z-50 flex items-center justify-center p-[max(1rem,var(--safe-top))] pb-[max(1rem,var(--safe-bottom))]"
              >
                <motion.button
                  type="button"
                  aria-label="Fermer"
                  onClick={() => setOpen(false)}
                  className="absolute inset-0 cursor-zoom-out bg-black/85 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={micro}
                />
                <motion.div
                  layoutId={layoutId}
                  transition={SPRING.layout}
                  className="relative max-h-full w-full max-w-4xl overflow-y-auto rounded-2xl border border-line bg-surface p-4 sm:p-6"
                >
                  <Illustration />
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="mt-4 min-h-11 w-full rounded-full border border-line text-fluid-sm font-semibold"
                  >
                    Fermer
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
