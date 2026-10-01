"use client";

import { motion } from "motion/react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { MatchingRound } from "@/types";
import { EASE_OUT, SHAKE } from "../motion-tokens";
import { ExplanationPanel, LearnMore } from "./explanation-panel";

interface Line {
  id: string;
  d: string;
}

type Side = "term" | "definition";

/** Tap a term, then a definition. A right pair draws a line between them. */
export function MatchingRoundView({
  round,
  onLink,
  onComplete,
}: {
  round: MatchingRound;
  onLink: (correct: boolean) => void;
  onComplete: () => void;
}) {
  const [selected, setSelected] = useState<{ side: Side; id: string } | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [mistake, setMistake] = useState<{ ids: string[]; key: number } | null>(null);
  const [errors, setErrors] = useState(0);
  const [lines, setLines] = useState<Line[]>([]);

  const container = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLElement>());
  const register = (key: string) => (el: HTMLElement | null) => {
    if (el) nodes.current.set(key, el);
    else nodes.current.delete(key);
  };

  const measure = useCallback(() => {
    const box = container.current?.getBoundingClientRect();
    if (!box) return;
    setLines(
      matched.flatMap((id) => {
        const a = nodes.current.get(`term:${id}`)?.getBoundingClientRect();
        const b = nodes.current.get(`definition:${id}`)?.getBoundingClientRect();
        if (!a || !b) return [];
        const x1 = a.right - box.left;
        const y1 = a.top + a.height / 2 - box.top;
        const x2 = b.left - box.left;
        const y2 = b.top + b.height / 2 - box.top;
        const mid = (x1 + x2) / 2;
        return [{ id, d: `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}` }];
      }),
    );
  }, [matched]);

  useLayoutEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, [measure]);

  const pick = (side: Side, id: string) => {
    if (matched.includes(id)) return;
    if (selected?.side === side && selected.id === id) {
      setSelected(null);
      return;
    }
    if (!selected || selected.side === side) {
      setSelected({ side, id });
      return;
    }
    const correct = selected.id === id;
    onLink(correct);
    setSelected(null);
    if (correct) {
      const next = [...matched, id];
      setMatched(next);
      if (next.length === round.pairs.length) onComplete();
    } else {
      setErrors((e) => e + 1);
      setMistake((m) => ({ ids: [`${selected.side}:${selected.id}`, `${side}:${id}`], key: (m?.key ?? 0) + 1 }));
    }
  };

  const done = matched.length === round.pairs.length;
  const definitions = round.definitionOrder.map((id) => round.pairs.find((p) => p.id === id)!);

  const item = (side: Side, id: string, text: string) => {
    const key = `${side}:${id}`;
    const isMatched = matched.includes(id);
    const isSelected = selected?.side === side && selected.id === id;
    const isWrong = mistake?.ids.includes(key);
    return (
      <motion.button
        key={isWrong ? `${key}:${mistake!.key}` : key}
        ref={register(key)}
        type="button"
        onClick={() => pick(side, id)}
        disabled={isMatched || done}
        animate={isWrong ? SHAKE : undefined}
        whileTap={isMatched ? undefined : { scale: 0.97 }}
        aria-pressed={isSelected}
        className={`min-h-12 w-full rounded-xl border px-3 py-2.5 text-left transition-colors duration-200 ${
          side === "term" ? "text-fluid-sm font-semibold" : "text-fluid-xs leading-snug sm:text-fluid-sm"
        } ${
          isMatched
            ? "border-good/70 bg-good-soft text-text"
            : isSelected
              ? "border-accent bg-accent-soft"
              : isWrong
                ? "border-bad bg-bad-soft"
                : "border-line bg-surface-2 hover:border-accent/60"
        }`}
      >
        {text}
      </motion.button>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-fluid-xl font-semibold leading-snug">Relie chaque terme à sa définition</h2>
        <p className="mt-1 text-fluid-sm text-muted">Touche un terme, puis la définition qui lui correspond.</p>
      </div>

      <div ref={container} className="relative grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-8 sm:gap-x-14">
        <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
          {lines.map((line) => (
            <motion.path
              key={line.id}
              d={line.d}
              fill="none"
              stroke="var(--good)"
              strokeWidth={2.5}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.4 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
            />
          ))}
        </svg>
        <ul className="flex flex-col justify-around gap-2.5">
          {round.pairs.map((p) => (
            <li key={p.id}>{item("term", p.id, p.term)}</li>
          ))}
        </ul>
        <ul className="flex flex-col gap-2.5">
          {definitions.map((p) => (
            <li key={p.id}>{item("definition", p.id, p.definition)}</li>
          ))}
        </ul>
      </div>

      {done && (
        <ExplanationPanel
          outcome={errors === 0 ? "correct" : "partial"}
          explanation={{
            text:
              errors === 0
                ? "Sans faute : les quatre paires sont justes du premier coup."
                : `Toutes les paires sont reliées, avec ${errors} erreur${errors > 1 ? "s" : ""} en route.`,
          }}
        >
          <ul className="flex flex-col gap-2">
            {round.pairs.map((p) => (
              <li key={p.id} className="rounded-xl bg-surface-2 p-3 text-fluid-sm leading-relaxed">
                <span className="font-semibold text-accent">{p.term} : </span>
                {p.definition}
                {p.pitfall && <span className="mt-1 block text-text/80">Piège : {p.pitfall}</span>}
                {p.more && <LearnMore more={p.more} title={p.term} />}
              </li>
            ))}
          </ul>
        </ExplanationPanel>
      )}
    </div>
  );
}
