import type { LensRole } from "./camera";

/** Bounds are in seconds for the shutter speed, in f-number for the aperture. */
export type Constraint =
  | { setting: "shutter"; slowest?: number; fastest?: number; message: string }
  | { setting: "aperture"; widest?: number; narrowest?: number; message: string }
  | { setting: "iso"; min?: number; max?: number; message: string };

export type Ambience = "daylight" | "overcast" | "dusk" | "blue-hour" | "night" | "indoor";

export type PreviewSubject =
  | "cyclist"
  | "golfer"
  | "portrait"
  | "buildings"
  | "mural"
  | "cars"
  | "silhouette"
  | "child"
  | "waterfall"
  | "player"
  | "statue"
  | "walker";

export type PreviewMotion =
  | { type: "none" }
  /** The subject moves: motion blur beyond this duration. */
  | {
      type: "subject";
      freezeAt: number;
      direction: "horizontal" | "vertical";
      /** Exact direction of the motion in the frame, in degrees (0 = to the right, 90 = downwards). */
      angle?: number;
    }
  /** The photographer pans with the subject: background streaks, subject stays sharp within the range. */
  | { type: "panning"; slowest: number; fastest: number };

/** Where a cut out subject sits in the frame, in fractions of the frame size. */
export type SubjectPlacement =
  /** Same framing as the background: a layer extracted from the same photo. */
  | { kind: "fill" }
  | { kind: "box"; centerX: number; bottom: number; height: number };

/** Real photo layers for the live preview. Paths are relative to /public. */
export interface PreviewPhoto {
  background: string;
  subject?: { src: string; placement: SubjectPlacement; silhouette?: boolean; flip?: boolean };
  /** Key of the photo credits registry. */
  credits: readonly string[];
}

export interface Scenario {
  id: string;
  title: string;
  situation: string;
  intent: string;
  lens: { role: LensRole; focalLength: number };
  /** Scene EV at ISO 100. */
  ev: number;
  /** Intended exposure offset in stops. -1: deliberately underexpose by one stop. */
  exposureBias?: number;
  support: "handheld" | "tripod";
  constraints: readonly Constraint[];
  preview: { ambience: Ambience; subject: PreviewSubject; motion: PreviewMotion; photo?: PreviewPhoto };
  /** May contain {lens}, {maxAperture}, {maxShutter}, {stabilization}, {model} placeholders. */
  explanation: string;
  keyword?: string;
}
