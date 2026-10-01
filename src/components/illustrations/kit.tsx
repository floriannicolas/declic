"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId } from "react";
import { micro } from "../motion-tokens";

/** Pill shaped segmented control shared by the illustrations. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const layoutId = useId();
  return (
    <div
      role="group"
      aria-label={label}
      className="grid gap-1 rounded-full border border-line bg-surface-2 p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className="relative min-h-11 rounded-full px-1 text-fluid-xs font-medium sm:text-fluid-sm"
        >
          {value === o.id && <motion.span layoutId={layoutId} transition={micro} className="absolute inset-0 rounded-full bg-accent" />}
          <span className={`relative ${value === o.id ? "text-accent-ink" : "text-muted"}`}>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Native range input with a 44 px touch target, labelled with the current value. */
export function Slider({
  label,
  min,
  max,
  value,
  onChange,
  display,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  display: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-baseline justify-between text-fluid-xs text-muted">
        {label}
        <span className="tabular text-fluid-sm font-semibold text-accent">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 w-full cursor-pointer accent-[var(--accent)]"
      />
    </label>
  );
}

/** Caption that cross fades when the illustration state changes. */
export function Caption({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.figcaption
        key={id}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={micro}
        className="text-fluid-sm leading-relaxed"
      >
        {children}
      </motion.figcaption>
    </AnimatePresence>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-fluid-xs leading-relaxed text-muted">{children}</p>;
}

/** Framed SVG canvas used by every illustration. */
export function Canvas({ label, children, height = 210 }: { label: string; children: React.ReactNode; height?: number }) {
  const id = useId();
  return (
    <svg viewBox={`0 0 360 ${height}`} className="w-full overflow-hidden rounded-xl border border-line bg-[#0f131c]" role="img" aria-labelledby={id}>
      <title id={id}>{label}</title>
      {children}
    </svg>
  );
}

export const figureClass = "flex flex-col gap-3";
