/** Embedded illustrations, each implemented by a component of the illustration registry. */
export const ILLUSTRATION_IDS = [
  "aperture",
  "shutter",
  "iso",
  "triangle",
  "stops",
  "depth-of-field",
  "bokeh",
  "metering",
  "autofocus",
  "af-motor",
  "stabilization",
  "compensation",
  "panning",
  "sensor",
  "focal-length",
  "exposure-modes",
] as const;

export type IllustrationId = (typeof ILLUSTRATION_IDS)[number];

/** Optional "learn more" block shown under any explanation. */
export interface Deepening {
  paragraphs: readonly string[];
  illustration?: IllustrationId;
}

/** Hand-written multiple choice question: one right answer, three plausible distractors. */
export interface McqQuestion {
  id: string;
  prompt: string;
  answer: string;
  distractors: readonly [string, string, string];
  explanation: string;
  /** Phrase of the explanation highlighted after answering. */
  keyword?: string;
  /** Restricts the question to some chapters. Absent: valid everywhere. */
  chapters?: readonly string[];
  more?: Deepening;
}

export interface Term {
  id: string;
  term: string;
  definition: string;
  /** Common misconception to debunk in the explanation. */
  pitfall?: string;
  more?: Deepening;
}

export interface Diagnosis {
  id: string;
  symptom: string;
  cause: string;
  wrongCauses: readonly [string, string, string];
  fix: string;
  more?: Deepening;
}

/** Normalized shape produced by the engine, whatever the mode. */
export interface ChoiceQuestion {
  id: string;
  prompt: string;
  options: readonly ChoiceOption[];
  answerId: string;
  explanation: Explanation;
}

export interface ChoiceOption {
  id: string;
  text: string;
}

export interface Explanation {
  text: string;
  keyword?: string;
  /** Secondary paragraph: fix to apply, nuance, pitfall. */
  extra?: { title: string; text: string };
  more?: Deepening;
  /** Subject of the "learn more" block, usually the term. */
  moreTitle?: string;
}

export interface MatchingRound {
  id: string;
  pairs: readonly { id: string; term: string; definition: string; pitfall?: string; more?: Deepening }[];
  /** Shuffled display order of the definitions. */
  definitionOrder: readonly string[];
}
