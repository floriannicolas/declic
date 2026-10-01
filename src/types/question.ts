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
}

export interface Term {
  id: string;
  term: string;
  definition: string;
  /** Common misconception to debunk in the explanation. */
  pitfall?: string;
}

export interface Diagnosis {
  id: string;
  symptom: string;
  cause: string;
  wrongCauses: readonly [string, string, string];
  fix: string;
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
}

export interface MatchingRound {
  id: string;
  pairs: readonly { id: string; term: string; definition: string; pitfall?: string }[];
  /** Shuffled display order of the definitions. */
  definitionOrder: readonly string[];
}
