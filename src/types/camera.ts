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

/**
 * Places on the generic 3D body where a control can sit. The model draws
 * them; the profile says which exist on this camera and what they do.
 */
export const BODY_ANCHORS = [
  "shutter-button",
  "power-switch",
  "mode-dial",
  "command-dial",
  "exposure-compensation-button",
  "info-button",
  "menu-button",
  "i-button",
  "playback-button",
  "live-view-switch",
  "movie-record-button",
  "release-mode-button",
  "help-button",
  "ae-af-lock-button",
  "multi-selector",
  "delete-button",
  "zoom-button",
  "rear-screen",
  "viewfinder",
  "diopter",
  "built-in-flash",
  "hot-shoe",
  "flash-button",
  "fn-button",
  "lens-release",
  "zoom-ring",
  "focus-ring",
  "af-assist-lamp",
  "card-slot",
  "battery",
  "ports",
  "microphone",
  "speaker",
  "card-access-lamp",
] as const;

export type BodyAnchor = (typeof BODY_ANCHORS)[number];

export interface CameraPart {
  id: string;
  anchor: BodyAnchor;
  name: string;
  role: string;
  tip?: string;
  /** Vocabulary term ids recalled with the part, looked up in every chapter. */
  terms?: readonly string[];
}

export type Vec3 = readonly [number, number, number];

/** Where a control sits on the 3D model, in viewer coordinates (model normalised to fit). */
export interface ModelSpot {
  position: Vec3;
  /** Direction the control faces, used to hide its marker from behind. */
  normal: Vec3;
}

/** Scanned or modelled 3D file shown instead of the generic body. */
export interface CameraModel3d {
  /** Path under /public, a .glb compressed with meshopt. */
  src: string;
  /** Shown under the viewer, e.g. when the model is a close relative of the camera. */
  label: string;
  credit: { author: string; license: string; licenseUrl: string; sourceUrl: string; changes: string };
  /** Euler rotation applied before normalising, so the lens points to +z and the top to +y. */
  rotation?: Vec3;
  spots: Readonly<Partial<Record<BodyAnchor, ModelSpot>>>;
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
  /** Controls explained in the 3D view. Absent: the 3D view is hidden. */
  parts?: readonly CameraPart[];
  /** Realistic model. Absent: the generic body built in code is used. */
  model3d?: CameraModel3d;
}
