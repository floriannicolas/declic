import type { McqQuestion } from "./question";

export type Setting = "shutter" | "aperture" | "iso";

/**
 * Role of a lens in the kit. Scenarios ask for a role and a focal length, never
 * for a specific lens: this is what keeps a chapter valid for any camera body.
 */
export type LensRole = "standard-zoom" | "fast-prime" | "telephoto" | "wide-angle";

/** "30 s", "2,5 s", "1/1,3", "1/250": the engine derives the duration. */
export type ShutterLabel = string;

export interface Lens {
  id: string;
  name: string;
  role: LensRole;
  focalLengths: readonly number[];
  /** Widest aperture (smallest f-number) reachable at each focal length. */
  maxApertureByFocal: Readonly<Record<number, number>>;
  /** Largest f-number, narrowest aperture. */
  minAperture: number;
  stabilized: boolean;
  /** Stabilization gain in stops, used for handheld camera shake. */
  stabilizationStops?: number;
  retractable?: boolean;
}

export interface Camera {
  id: string;
  brand: string;
  model: string;
  sensor: { format: string; megapixels: number; cropFactor: number };
  iso: { min: number; max: number; scale: readonly number[] };
  shutter: { scale: readonly ShutterLabel[] };
  /** Aperture scale displayed by the body, then bounded by the lens. */
  aperture: { scale: readonly number[] };
  burstFps: number;
  afPoints: number;
  flashSync: ShutterLabel;
  modes: readonly string[];
  hasAfMotor: boolean;
  lenses: readonly Lens[];
  /** Rear screen: order of the dials from left to right and their captions. */
  screen: {
    layout: readonly [Setting, Setting, Setting];
    captions: Readonly<Record<Setting, string>>;
  };
  controls: Readonly<Record<string, string>>;
  vocabulary: Readonly<Record<string, string>>;
  /** Questions of the camera specific mode. */
  questions: readonly McqQuestion[];
}
