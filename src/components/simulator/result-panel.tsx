"use client";

import { motion } from "motion/react";
import type { ScenarioResult } from "@/engine/simulator";
import { ExplanationPanel } from "../play/explanation-panel";

const EXPOSURE_TONE = {
  correct: "border-good/60 bg-good-soft",
  close: "border-accent/60 bg-accent-soft",
  over: "border-bad/60 bg-bad-soft",
  under: "border-bad/60 bg-bad-soft",
} as const;

export function ResultPanel({ result, settings, example }: { result: ScenarioResult; settings: string; example: string | null }) {
  const { exposure, constraints } = result;
  return (
    <ExplanationPanel outcome={result.outcome} explanation={{ text: result.explanation, keyword: result.keyword }}>
      <p className="tabular text-fluid-sm text-muted">Tes réglages : {settings}</p>
      <ul className="flex flex-col gap-2">
        <Row index={0} ok={exposure.verdict === "correct"} tone={EXPOSURE_TONE[exposure.verdict]} title="Exposition" text={exposure.label} />
        {constraints.map((c, i) => (
          <Row
            key={i}
            index={i + 1}
            ok={c.met}
            tone={c.met ? "border-line bg-surface-2" : "border-bad/60 bg-bad-soft"}
            title={c.title ?? (c.met ? "Intention respectée" : c.message)}
            text={c.met ? c.message : c.title ? `${c.message} ${c.detail}` : c.detail}
          />
        ))}
      </ul>
      {example && (
        <p className="tabular rounded-xl bg-surface-2 p-3 text-fluid-sm">
          <span className="font-semibold text-accent">Exemple de réglage juste, proche du tien : </span>
          {example}
        </p>
      )}
    </ExplanationPanel>
  );
}

function Row({ index, ok, tone, title, text }: { index: number; ok: boolean; tone: string; title: string; text: string }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, duration: 0.22 }}
      className={`flex gap-3 rounded-xl border p-3 ${tone}`}
    >
      <span aria-hidden className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold text-bg ${ok ? "bg-good" : "bg-bad"}`}>
        {ok ? "✓" : "✕"}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-fluid-sm font-semibold">{title}</span>
        <span className="text-fluid-sm text-text/85">{text}</span>
      </span>
    </motion.li>
  );
}
