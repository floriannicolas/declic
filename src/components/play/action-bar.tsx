"use client";

import { AnimatePresence, motion } from "motion/react";
import { micro } from "../motion-tokens";

/** Bottom bar holding the main action, clear of the home indicator. */
export function ActionBar({
  label,
  onClick,
  disabled,
  visible = true,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  visible?: boolean;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={micro}
          className="fixed inset-x-0 bottom-0 z-20 border-t border-line/70 bg-surface/90 pb-[max(0.75rem,var(--safe-bottom))] pt-3 backdrop-blur-md"
        >
          <div className="mx-auto flex w-full max-w-5xl justify-end px-[max(1rem,var(--safe-left))]">
            <motion.button
              type="button"
              onClick={onClick}
              disabled={disabled}
              whileTap={{ scale: 0.97 }}
              transition={micro}
              className="min-h-12 w-full rounded-full bg-accent px-6 text-fluid-base font-semibold text-accent-ink transition-opacity disabled:opacity-40 sm:w-auto sm:min-w-56"
            >
              {label}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
