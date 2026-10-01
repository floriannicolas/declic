import type { Setting, ShutterLabel } from "./camera";
import type { Diagnosis, IllustrationId, McqQuestion, Term } from "./question";
import type { Scenario } from "./scenario";

export type ModeId = "simulator" | "stops" | "vocabulary" | "diagnosis" | "camera";

/** Full-stop scales used to generate the stop arithmetic questions. */
export interface StopScales {
  apertures: readonly number[];
  shutterSpeeds: readonly ShutterLabel[];
  isos: readonly number[];
}

/** Short guide a player can open at any time: method, illustration, vocabulary reminders. */
export interface Guide {
  title: string;
  paragraphs: readonly string[];
  illustration?: IllustrationId;
  /** Ids of chapter terms recalled at the end of the guide. */
  terms?: readonly string[];
}

export type GuideId = Setting | "stops" | "simulator";

/**
 * A chapter only holds teaching content. A mode whose content is empty does
 * not show up in the menu.
 */
export interface Chapter {
  id: string;
  number: number;
  title: string;
  summary: string;
  scenarios: readonly Scenario[];
  stops?: StopScales;
  vocabulary: readonly Term[];
  /** Course questions mixed into the vocabulary mode: exposure modes, pitfalls. */
  questions: readonly McqQuestion[];
  diagnoses: readonly Diagnosis[];
  guides?: Readonly<Partial<Record<GuideId, Guide>>>;
}
