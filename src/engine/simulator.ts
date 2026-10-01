import type { Camera, Constraint, Scenario, Setting } from "@/types";
import { judgeExposure, settingsEv, type ExposureJudgement } from "./exposure";
import { formatAperture, formatNumber, formatSeconds } from "./format";
import { apertureRange, mountLens, narrowLimitMessage, wideLimitMessage, type MountedLens } from "./lens";
import { shutterSeconds } from "./shutter";
import { fillTemplate } from "./template";

/** Positions on each scale of the camera profile. */
export type SettingIndices = Record<Setting, number>;

export interface SettingValues {
  seconds: number;
  fNumber: number;
  iso: number;
}

export interface DialScale {
  setting: Setting;
  labels: readonly string[];
  /** Numeric value of each step, used for interpolation while a dial turns. */
  values: readonly number[];
  /** Reachable range. Outside of it the dial pushes back and explains why. */
  min: number;
  max: number;
  limitMessage: (direction: "low" | "high") => string;
}

/** Everything the simulator needs for a scenario, derived from the camera profile only. */
export interface SimulatorSetup {
  scenario: Scenario;
  camera: Camera;
  mounted: MountedLens;
  scales: Record<Setting, DialScale>;
  targetEv: number;
}

const FULL_STOP_SHUTTER = 1 / 125;
const FULL_STOP_APERTURE = 5.6;

export function setupSimulator(camera: Camera, scenario: Scenario): SimulatorSetup {
  const mounted = mountLens(camera, scenario.lens);
  const apertures = apertureRange(camera, mounted);
  const shutterValues = camera.shutter.scale.map(shutterSeconds);
  const lastShutter = camera.shutter.scale.length - 1;
  const lastIso = camera.iso.scale.length - 1;

  return {
    scenario,
    camera,
    mounted,
    targetEv: scenario.ev - (scenario.exposureBias ?? 0),
    scales: {
      shutter: {
        setting: "shutter",
        labels: camera.shutter.scale,
        values: shutterValues,
        min: 0,
        max: lastShutter,
        limitMessage: (direction) =>
          direction === "high"
            ? `Le ${camera.model} ne descend pas sous ${camera.shutter.scale[lastShutter]} s.`
            : `Le ${camera.model} ne pose pas plus de ${camera.shutter.scale[0]} en réglage normal.`,
      },
      aperture: {
        setting: "aperture",
        labels: camera.aperture.scale.map(formatAperture),
        values: camera.aperture.scale,
        min: apertures.min,
        max: apertures.max,
        limitMessage: (direction) => (direction === "low" ? wideLimitMessage(mounted) : narrowLimitMessage(mounted)),
      },
      iso: {
        setting: "iso",
        labels: camera.iso.scale.map(String),
        values: camera.iso.scale,
        min: 0,
        max: lastIso,
        limitMessage: (direction) =>
          direction === "high"
            ? `Le ${camera.model} ne monte pas au-delà de ${camera.iso.max} ISO.`
            : `Le ${camera.model} ne descend pas sous ${camera.iso.min} ISO.`,
      },
    },
  };
}

const nearestIndex = (values: readonly number[], target: number, min: number, max: number) => {
  let best = min;
  for (let i = min; i <= max; i++) {
    if (Math.abs(Math.log(values[i] / target)) < Math.abs(Math.log(values[best] / target))) best = i;
  }
  return best;
};

/** Neutral starting point: 1/125, f/5.6 (or the closest reachable), lowest ISO. */
export function initialIndices(setup: SimulatorSetup): SettingIndices {
  const { shutter, aperture, iso } = setup.scales;
  return {
    shutter: nearestIndex(shutter.values, FULL_STOP_SHUTTER, shutter.min, shutter.max),
    aperture: nearestIndex(aperture.values, FULL_STOP_APERTURE, aperture.min, aperture.max),
    iso: iso.min,
  };
}

export function valuesAt(setup: SimulatorSetup, indices: SettingIndices): SettingValues {
  return {
    seconds: setup.scales.shutter.values[indices.shutter],
    fNumber: setup.scales.aperture.values[indices.aperture],
    iso: setup.scales.iso.values[indices.iso],
  };
}

/** Value at a fractional position of a scale, interpolated on a log scale like the stops themselves. */
export function interpolate(values: readonly number[], position: number): number {
  const clamped = Math.min(Math.max(position, 0), values.length - 1);
  const i = Math.floor(clamped);
  const next = Math.min(i + 1, values.length - 1);
  const t = clamped - i;
  return Math.exp(Math.log(values[i]) * (1 - t) + Math.log(values[next]) * t);
}

export interface ConstraintResult {
  met: boolean;
  /** Overrides the default row title. */
  title?: string;
  message: string;
  detail: string;
}

const TOLERANCE = 2 ** (1 / 6);

const within = (value: number, low?: number, high?: number) =>
  (low === undefined || value >= low / TOLERANCE) && (high === undefined || value <= high * TOLERANCE);

function describeBounds(low: string | undefined, high: string | undefined): string {
  if (low && high) return `entre ${low} et ${high}`;
  if (low) return `${low} ou plus`;
  return `${high} au maximum`;
}

function checkConstraint(c: Constraint, v: SettingValues): ConstraintResult {
  switch (c.setting) {
    case "shutter": {
      const fastest = c.fastest === undefined ? undefined : formatSeconds(c.fastest);
      const slowest = c.slowest === undefined ? undefined : formatSeconds(c.slowest);
      const expected =
        fastest && slowest ? `entre ${fastest} et ${slowest}` : fastest ? `${fastest} ou plus lente` : `${slowest} ou plus rapide`;
      return {
        met: within(v.seconds, c.fastest, c.slowest),
        message: c.message,
        detail: `Vitesse réglée : ${formatSeconds(v.seconds)}, attendue ${expected}.`,
      };
    }
    case "aperture":
      return {
        met: within(v.fNumber, c.widest, c.narrowest),
        message: c.message,
        detail: `Ouverture réglée : ${formatAperture(v.fNumber)}, attendue ${
          c.widest !== undefined && c.narrowest !== undefined
            ? `entre ${formatAperture(c.widest)} et ${formatAperture(c.narrowest)}`
            : c.widest !== undefined
              ? `${formatAperture(c.widest)} ou plus fermée`
              : `${formatAperture(c.narrowest!)} ou plus ouverte`
        }.`,
      };
    case "iso":
      return {
        met: within(v.iso, c.min, c.max),
        message: c.message,
        detail: `ISO réglé : ${v.iso}, attendu ${describeBounds(c.min?.toString(), c.max?.toString())}.`,
      };
  }
}

/** Slowest handheld speed: 1 / (focal x crop), extended by the lens stabilization. */
export function handheldLimit(setup: SimulatorSetup): number {
  const { camera, mounted } = setup;
  const base = 1 / (mounted.focalLength * camera.sensor.cropFactor);
  return mounted.lens.stabilized ? base * 2 ** (mounted.lens.stabilizationStops ?? 0) : base;
}

function checkCameraShake(setup: SimulatorSetup, v: SettingValues): ConstraintResult | null {
  if (setup.scenario.support !== "handheld") return null;
  const { camera, mounted } = setup;
  const limit = handheldLimit(setup);
  const base = 1 / (mounted.focalLength * camera.sensor.cropFactor);
  const stabilization = camera.vocabulary.stabilization ?? "stabilisation";
  const withStabilization = mounted.lens.stabilized ? `, ${formatSeconds(limit)} avec la ${stabilization}` : "";
  const met = v.seconds <= limit * TOLERANCE;
  return {
    met,
    title: met ? "Pas de risque de bougé" : "Risque de flou de bougé",
    message: `À main levée, la règle de sécurité est 1 / (focale x ${formatNumber(camera.sensor.cropFactor)}) sur un capteur ${camera.sensor.format}.`,
    detail: `À ${mounted.focalLength} mm, cela donne ${formatSeconds(base)}${withStabilization}. Tu as réglé ${formatSeconds(v.seconds)}.`,
  };
}

export type Outcome = "correct" | "partial" | "wrong";

export interface ScenarioResult {
  exposure: ExposureJudgement;
  constraints: ConstraintResult[];
  outcome: Outcome;
  explanation: string;
  keyword?: string;
}

export function evaluateScenario(setup: SimulatorSetup, indices: SettingIndices): ScenarioResult {
  const v = valuesAt(setup, indices);
  const exposure = judgeExposure(settingsEv(v.fNumber, v.seconds, v.iso), setup.targetEv);
  const shake = checkCameraShake(setup, v);
  const constraints = [...setup.scenario.constraints.map((c) => checkConstraint(c, v)), ...(shake ? [shake] : [])];
  const allMet = constraints.every((c) => c.met);

  const outcome: Outcome =
    exposure.verdict === "correct" && allMet
      ? "correct"
      : (exposure.verdict === "correct" && constraints.filter((c) => !c.met).length === 1) ||
          (exposure.verdict === "close" && allMet)
        ? "partial"
        : "wrong";

  return {
    exposure,
    constraints,
    outcome,
    explanation: fillTemplate(setup.scenario.explanation, setup.camera, setup.mounted),
    keyword: setup.scenario.keyword && fillTemplate(setup.scenario.keyword, setup.camera, setup.mounted),
  };
}

/**
 * Full stops are powers of two (of sqrt(2) for apertures). The dials draw
 * them as major ticks, whatever the step of the camera scale.
 */
export function isFullStop(setting: Setting, value: number): boolean {
  const stops = setting === "aperture" ? 2 * Math.log2(value) : setting === "iso" ? Math.log2(value / 100) : Math.log2(value);
  return Math.abs(stops - Math.round(stops)) < 0.1;
}

/**
 * Brute force over every reachable triplet: the right answer closest to the
 * player's settings (in steps), or any right answer when `from` is omitted.
 */
export function findSolution(setup: SimulatorSetup, from?: SettingIndices): SettingIndices | null {
  const { shutter, aperture, iso } = setup.scales;
  let best: SettingIndices | null = null;
  let bestDistance = Infinity;
  for (let s = shutter.min; s <= shutter.max; s++)
    for (let a = aperture.min; a <= aperture.max; a++)
      for (let i = iso.min; i <= iso.max; i++) {
        const indices = { shutter: s, aperture: a, iso: i };
        if (evaluateScenario(setup, indices).outcome !== "correct") continue;
        if (!from) return indices;
        const distance = Math.abs(s - from.shutter) + Math.abs(a - from.aperture) + Math.abs(i - from.iso);
        if (distance < bestDistance) {
          best = indices;
          bestDistance = distance;
        }
      }
  return best;
}
