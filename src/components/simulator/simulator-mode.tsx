"use client";

import { AnimatePresence, animate, motion, useMotionValue } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { formatAperture, formatSeconds } from "@/engine/format";
import { shuffle } from "@/engine/random";
import {
  evaluateScenario,
  findSolution,
  initialIndices,
  setupSimulator,
  valuesAt,
  type ScenarioResult,
  type SettingIndices,
} from "@/engine/simulator";
import type { Setting } from "@/types";
import { DURATION, EASE_OUT, SPRING, micro } from "../motion-tokens";
import { ActionBar } from "../play/action-bar";
import { GuideButton } from "../play/guide-sheet";
import type { ModeProps } from "../play/mode-screen";
import { Dial } from "./dial";
import { ResultPanel } from "./result-panel";
import { ScenePreview } from "./scene-preview";

const LIMIT_TOAST_MS = 4500;

const UNIT = { singular: "scénario", plural: "scénarios" };

export function SimulatorMode({ chapter, camera, onAnswer, onProgress, onComplete }: ModeProps) {
  const [scenarios] = useState(() => shuffle(chapter.scenarios));
  const [round, setRound] = useState(() => ({ n: 1, scenario: scenarios[0] }));
  const isLast = round.n === scenarios.length;
  const setup = useMemo(() => setupSimulator(camera, round.scenario), [camera, round.scenario]);

  const [indices, setIndices] = useState<SettingIndices>(() => initialIndices(setup));
  const positions = {
    shutter: useMotionValue(indices.shutter),
    aperture: useMotionValue(indices.aperture),
    iso: useMotionValue(indices.iso),
  };
  const [active, setActive] = useState<Setting>(camera.screen.layout[0]);
  const [result, setResult] = useState<{ result: ScenarioResult; example: SettingIndices | null; practice: boolean } | null>(null);
  // Only the first shot of a scenario is scored; later ones are practice.
  const [scored, setScored] = useState(false);
  const [limit, setLimit] = useState<{ message: string; key: number } | null>(null);

  const done = round.n - 1 + (scored ? 1 : 0);
  useEffect(() => {
    onProgress({ done, total: scenarios.length, unit: UNIT });
  }, [done, scenarios.length, onProgress]);

  useEffect(() => {
    if (!limit) return;
    const timer = setTimeout(() => setLimit(null), LIMIT_TOAST_MS);
    return () => clearTimeout(timer);
  }, [limit]);

  const validate = () => {
    const evaluated = evaluateScenario(setup, indices);
    setResult({ result: evaluated, example: evaluated.outcome === "correct" ? null : findSolution(setup, indices), practice: scored });
    if (!scored) {
      onAnswer(evaluated.outcome);
      setScored(true);
    }
  };

  /** Unlocks the dials, keeping the current settings. */
  const retry = () => {
    setResult(null);
    document.querySelector("[data-dials]")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  /** Turns every dial to the closest right answer, so the preview shows what changes. */
  const tryExample = () => {
    const target = result?.example;
    if (!target) return;
    setResult(null);
    (Object.keys(target) as Setting[]).forEach((s) => animate(positions[s], target[s], { ...SPRING.dial, delay: 0.15 }));
    setIndices(target);
    document.querySelector("[data-dials]")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const nextScenario = () => {
    if (isLast) return onComplete();
    const scenario = scenarios[round.n];
    const start = initialIndices(setupSimulator(camera, scenario));
    (Object.keys(start) as Setting[]).forEach((s) => positions[s].jump(start[s]));
    setIndices(start);
    setResult(null);
    setScored(false);
    setLimit(null);
    setRound((r) => ({ n: r.n + 1, scenario }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { scenario, mounted } = setup;
  const values = valuesAt(setup, indices);
  const example = result?.example ? valuesAt(setup, result.example) : null;

  return (
    <>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={round.n}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: DURATION.screen, ease: EASE_OUT }}
          className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6 landscape-phone:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] landscape-phone:gap-x-4"
        >
          <section className="flex flex-col gap-3 lg:col-span-2 landscape-phone:col-start-2 landscape-phone:gap-2">
            <p className="tabular text-fluid-xs font-medium uppercase tracking-[0.2em] text-muted">
              Scénario {round.n} sur {scenarios.length}
            </p>
            <h2 className="text-fluid-xl font-semibold leading-tight">{scenario.title}</h2>
            <p className="max-w-prose text-fluid-base leading-relaxed text-text/90 landscape-phone:text-fluid-sm">{scenario.situation}</p>
            <p className="max-w-prose rounded-xl border-l-4 border-accent bg-accent-soft px-3 py-2 text-fluid-base font-medium">
              {scenario.intent}
            </p>
            {chapter.guides?.simulator && <GuideButton guide={chapter.guides.simulator} vocabulary={chapter.vocabulary} />}
            <ul className="flex flex-wrap gap-2 text-fluid-xs text-muted">
              <li className="rounded-full border border-line px-3 py-1">
                {mounted.lens.name}
                {mounted.lens.focalLengths.length > 1 ? ` à ${mounted.focalLength} mm` : ""}
              </li>
              <li className="rounded-full border border-line px-3 py-1">{scenario.support === "tripod" ? "Sur support" : "À main levée"}</li>
              {scenario.exposureBias ? (
                <li className="rounded-full border border-line px-3 py-1">Effet voulu : {scenario.exposureBias > 0 ? "+" : ""}{scenario.exposureBias} stop par rapport à la mesure</li>
              ) : null}
            </ul>
          </section>

          <div className="landscape-phone:sticky landscape-phone:top-[calc(var(--safe-top)+var(--bar-height)+0.5rem)] landscape-phone:col-start-1 landscape-phone:row-span-2 landscape-phone:row-start-1 landscape-phone:self-start lg:sticky lg:top-[calc(var(--bar-height)+1.5rem)] lg:self-start">
            <ScenePreview setup={setup} positions={positions} />
          </div>

          <div className="flex flex-col gap-4 landscape-phone:col-start-2">
            <div role="tablist" aria-label="Molette active" className="hidden grid-cols-3 gap-2 max-sm:grid landscape-phone:grid">
              {camera.screen.layout.map((s) => (
                <button
                  key={s}
                  role="tab"
                  type="button"
                  aria-selected={active === s}
                  onClick={() => setActive(s)}
                  className={`tabular flex min-h-12 flex-col items-center justify-center rounded-xl border px-1 leading-tight transition-colors duration-200 ${
                    active === s ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface-2 text-text"
                  }`}
                >
                  <span className="text-[0.7rem] uppercase tracking-wider text-muted">{camera.screen.captions[s]}</span>
                  <span className="text-fluid-sm font-semibold">{setup.scales[s].labels[indices[s]]}</span>
                </button>
              ))}
            </div>

            <div data-dials className="relative grid grid-cols-3 gap-3 rounded-[2rem] border border-line bg-bg/70 p-3 sm:gap-6 sm:p-5 max-sm:grid-cols-1 landscape-phone:grid-cols-1">
              {camera.screen.layout.map((s) => (
                <Dial
                  key={s}
                  help={chapter.guides?.[s] && <GuideButton guide={chapter.guides[s]} vocabulary={chapter.vocabulary} compact />}
                  scale={setup.scales[s]}
                  caption={camera.screen.captions[s]}
                  index={indices[s]}
                  position={positions[s]}
                  locked={result !== null}
                  onActivate={() => setActive(s)}
                  onChange={(i) => setIndices((prev) => ({ ...prev, [s]: i }))}
                  onLimit={(message) => setLimit({ message, key: Date.now() })}
                  className={`mx-auto w-full max-w-[15rem] ${
                    active === s ? "" : "max-sm:hidden landscape-phone:hidden"
                  } max-sm:max-w-[min(15rem,64vw)] landscape-phone:max-w-[min(13rem,46vh)]`}
                />
              ))}
              <AnimatePresence>
                {limit && (
                  <motion.p
                    key={limit.key}
                    role="status"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={micro}
                    className="absolute inset-x-3 top-3 z-10 rounded-xl border border-bad/60 bg-[color-mix(in_srgb,var(--bad)_18%,var(--surface))] px-3 py-2 text-fluid-sm shadow-lg"
                  >
                    {limit.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

          </div>

          {result && (
            <div className="lg:col-span-2 landscape-phone:col-start-2">
              <ResultPanel
                result={result.result}
                example={
                  example && `${formatSeconds(example.seconds)}, ${formatAperture(example.fNumber)}, ${example.iso} ISO`
                }
                settings={`${formatSeconds(values.seconds)}, ${formatAperture(values.fNumber)}, ${values.iso} ISO`}
                practice={result.practice}
                onRetry={result.result.outcome === "correct" ? undefined : retry}
                onTryExample={result.example ? tryExample : undefined}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <ActionBar label={result ? (isLast ? "Voir le bilan" : "Scénario suivant") : "Déclencher"} onClick={result ? nextScenario : validate} />
    </>
  );
}
