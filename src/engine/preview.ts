import type { Scenario } from "@/types";
import { settingsEv } from "./exposure";
import { handheldLimit, type SettingValues, type SimulatorSetup } from "./simulator";

/** Visual effects of a setting triplet, in pixels for a preview about 360 px wide. */
export interface PreviewEffects {
  backgroundBlur: number;
  /** Growth of the light points into bokeh discs. */
  bokehScale: number;
  subjectSmear: number;
  backgroundSmear: number;
  shake: number;
  /** 0: clean, 1: heavy grain. */
  grain: number;
  /** Positive: darker than intended, in stops. */
  exposureOffset: number;
  /** Star effect on point lights, from closing the aperture. */
  starburst: number;
}

/** Unit vector of the subject's motion blur in the frame. */
export function smearDirection(scenario: Scenario): [number, number] {
  const motion = scenario.preview.motion;
  if (motion.type !== "subject") return [1, 0];
  const degrees = motion.angle ?? (motion.direction === "vertical" ? 90 : 0);
  const rad = (degrees * Math.PI) / 180;
  return [Math.cos(rad), Math.sin(rad)];
}

const clamp = (x: number, min: number, max: number) => Math.min(Math.max(x, min), max);

const SHARP_APERTURE = 11;
const BLUR_PER_STOP = 3.2;
const SMEAR_PER_STOP = 7;
const PAN_REFERENCE = 1 / 250;
const GRAIN_START_ISO = 800;

export function previewEffects(setup: SimulatorSetup, v: SettingValues): PreviewEffects {
  const motion = setup.scenario.preview.motion;
  const backgroundBlur = clamp(Math.log2(SHARP_APERTURE / v.fNumber), 0, 4) * BLUR_PER_STOP;

  let subjectSmear = 0;
  let backgroundSmear = 0;
  if (motion.type === "subject") {
    subjectSmear = clamp(Math.log2(v.seconds / motion.freezeAt), 0, 9) * SMEAR_PER_STOP;
  } else if (motion.type === "panning") {
    backgroundSmear = clamp(Math.log2(v.seconds / PAN_REFERENCE), 0, 8) * 6;
    subjectSmear = clamp(Math.log2(v.seconds / motion.slowest), 0, 6) * 6;
  }

  const shake =
    setup.scenario.support === "handheld" ? clamp(Math.log2(v.seconds / handheldLimit(setup)), 0, 5) * 2.5 : 0;

  return {
    backgroundBlur,
    bokehScale: 1 + backgroundBlur / 3,
    subjectSmear,
    backgroundSmear,
    shake,
    grain: clamp(Math.log2(v.iso / GRAIN_START_ISO) / 3, 0, 1),
    exposureOffset: settingsEv(v.fNumber, v.seconds, v.iso) - setup.targetEv,
    starburst: clamp((v.fNumber - 5.6) / 5.4, 0, 1),
  };
}
