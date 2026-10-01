"use client";

import { AnimatePresence, animate, motion, useAnimate, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { isFullStop, type DialScale } from "@/engine/simulator";
import { SPRING } from "../motion-tokens";

const STEP_DEG = 15;
const PX_PER_STEP = 18;
const WINDOW = 11;
const WHEEL_STEP = 40;
const LIMIT_OVERSHOOT = 0.25;

/** Notched rotation: lingers around each value, moves fast in between. */
const detent = (p: number) => {
  const n = Math.floor(p);
  const t = p - n;
  return n + t - (Math.sin(2 * Math.PI * t) / (2 * Math.PI)) * 0.85;
};

/** Resistance beyond the reachable range, never more than about one step. */
const rubber = (excess: number) => (1 - 1 / (excess * 0.6 + 1)) * 1.1;

const BUTTON_LABELS: Record<DialScale["setting"], [string, string]> = {
  shutter: ["Vitesse plus lente", "Vitesse plus rapide"],
  aperture: ["Ouvrir le diaphragme", "Fermer le diaphragme"],
  iso: ["Baisser l'ISO", "Monter l'ISO"],
};

interface Props {
  scale: DialScale;
  caption: string;
  index: number;
  /** Continuous position shared with the live preview. */
  position: MotionValue<number>;
  onChange: (index: number) => void;
  onLimit: (message: string) => void;
  onActivate?: () => void;
  locked?: boolean;
  className?: string;
}

export function Dial({ scale, caption, index, position, onChange, onLimit, onActivate, locked, className }: Props) {
  const rotate = useTransform(position, (p) => -detent(p) * STEP_DEG);
  const [pointer, animatePointer] = useAnimate();
  const surface = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; start: number; last: number; raw: number; moved: boolean } | null>(null);
  const [roll, setRoll] = useState({ index, direction: 1 });
  if (roll.index !== index) setRoll({ index, direction: index > roll.index ? 1 : -1 });

  const clampIndex = (i: number) => Math.min(scale.max, Math.max(scale.min, i));

  const tick = () => {
    if (pointer.current) animatePointer(pointer.current, { scale: [1, 1.3, 1] }, { duration: 0.14 });
    navigator.vibrate?.(3);
  };

  const settle = (target: number) => animate(position, target, SPRING.dial);

  const step = (delta: number) => {
    if (locked) return;
    const target = index + delta;
    if (target < scale.min || target > scale.max) {
      onLimit(scale.limitMessage(target < scale.min ? "low" : "high"));
      animate(position, [index, index + Math.sign(delta) * 0.35, index], { duration: 0.25, ease: "easeOut" });
      return;
    }
    onChange(target);
    tick();
    settle(target);
  };

  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  });

  // Wheel needs a non passive listener to keep the page from scrolling.
  useEffect(() => {
    const el = surface.current;
    if (!el) return;
    let accumulated = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      accumulated += e.deltaY + e.deltaX * -1;
      while (Math.abs(accumulated) >= WHEEL_STEP) {
        stepRef.current(accumulated < 0 ? 1 : -1);
        accumulated -= Math.sign(accumulated) * WHEEL_STEP;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    onActivate?.();
    if (locked) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    position.stop();
    drag.current = { x: e.clientX, y: e.clientY, start: index, last: index, raw: index, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    d.moved = true;
    let raw = d.start + (dx - dy) / PX_PER_STEP;
    if (raw < scale.min) raw = scale.min - rubber(scale.min - raw);
    if (raw > scale.max) raw = scale.max + rubber(raw - scale.max);
    d.raw = raw;
    position.set(raw);
    const n = clampIndex(Math.round(raw));
    if (n !== d.last) {
      d.last = n;
      onChange(n);
      tick();
    }
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    if (d.raw < scale.min - LIMIT_OVERSHOOT) onLimit(scale.limitMessage("low"));
    if (d.raw > scale.max + LIMIT_OVERSHOOT) onLimit(scale.limitMessage("high"));
    settle(d.last);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const deltas: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 3, PageDown: -3 };
    if (e.key in deltas) {
      e.preventDefault();
      step(deltas[e.key]);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      step((e.key === "Home" ? scale.min : scale.max) - index);
    }
  };

  const first = Math.max(0, index - WINDOW);
  const last = Math.min(scale.values.length - 1, index + WINDOW);
  const ticks = [];
  for (let i = first; i <= last; i++) {
    const major = isFullStop(scale.setting, scale.values[i]);
    const outside = i < scale.min || i > scale.max;
    ticks.push(
      <g key={i} transform={`rotate(${i * STEP_DEG} 100 100)`}>
        <line
          x1="100"
          x2="100"
          y1={major ? 9 : 13}
          y2="21"
          stroke={outside ? "var(--bad)" : i === index ? "var(--accent)" : "var(--muted)"}
          strokeOpacity={outside ? 0.55 : 1}
          strokeWidth={major ? 2.4 : 1.4}
          strokeLinecap="round"
        />
        {major && (
          <text
            x="100"
            y="37"
            textAnchor="middle"
            fontSize="13"
            fontWeight={600}
            fill={outside ? "var(--bad)" : "var(--muted)"}
            opacity={outside ? 0.55 : 0.9}
            className="tabular"
            textDecoration={outside ? "line-through" : undefined}
          >
            {scale.labels[i]}
          </text>
        )}
      </g>,
    );
  }

  const [lessLabel, moreLabel] = BUTTON_LABELS[scale.setting];

  return (
    <div className={`flex flex-col items-center gap-2 ${className ?? ""}`}>
      <span className="text-fluid-xs font-medium uppercase tracking-[0.2em] text-muted">{caption}</span>
      <div
        ref={surface}
        role="slider"
        tabIndex={locked ? -1 : 0}
        aria-label={caption}
        aria-valuemin={scale.min}
        aria-valuemax={scale.max}
        aria-valuenow={index}
        aria-valuetext={scale.labels[index]}
        aria-disabled={locked}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className={`@container relative aspect-square w-full touch-none select-none rounded-full outline-offset-4 ${locked ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
      >
        <div className="absolute inset-0 rounded-full border border-line bg-[radial-gradient(circle_at_50%_35%,var(--surface-2),var(--bg)_75%)] shadow-[inset_0_2px_10px_rgb(0_0_0/0.5)]" />
        <div aria-hidden className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_28%,transparent_70%)]">
          <motion.div className="absolute inset-0 will-change-transform" style={{ rotate }}>
            <svg viewBox="0 0 200 200" className="size-full overflow-visible">
              {ticks}
            </svg>
          </motion.div>
        </div>
        <svg aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute inset-0 size-full">
          <motion.path ref={pointer} d="M 93 1 L 107 1 L 100 9 Z" fill="var(--accent)" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
        </svg>
        <div className="pointer-events-none absolute inset-x-0 top-[44%] flex h-[22%] items-center justify-center overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false} custom={roll.direction}>
            <motion.span
              key={index}
              custom={roll.direction}
              variants={{
                enter: (d: number) => ({ y: `${d * 60}%`, opacity: 0 }),
                center: { y: 0, opacity: 1 },
                exit: (d: number) => ({ y: `${d * -60}%`, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="tabular text-[clamp(1.5rem,7cqi,2.5rem)] font-semibold text-accent"
            >
              {scale.labels[index]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StepButton label={lessLabel} symbol="−" onClick={() => step(-1)} disabled={locked} />
        <StepButton label={moreLabel} symbol="+" onClick={() => step(1)} disabled={locked} />
      </div>
    </div>
  );
}

function StepButton({ label, symbol, onClick, disabled }: { label: string; symbol: string; onClick: () => void; disabled?: boolean }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.9 }}
      className="grid size-11 place-items-center rounded-full border border-line bg-surface-2 text-xl leading-none text-text transition-colors hover:border-accent/60 disabled:opacity-40"
    >
      {symbol}
    </motion.button>
  );
}
