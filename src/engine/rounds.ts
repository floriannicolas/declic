import type { Camera, Chapter, ChoiceQuestion, MatchingRound, McqQuestion, ModeId, Term } from "@/types";
import { cameraQuestionsFor, diagnosisToChoice, mcqToChoice, termsToMatching, termToChoice } from "./questions";
import { shuffle, type Rng } from "./random";
import { generateStopsQuestion } from "./stops";

export type Round = { kind: "choice"; question: ChoiceQuestion } | { kind: "matching"; round: MatchingRound };

export type QuizModeId = Exclude<ModeId, "simulator">;

/**
 * A finite session: every item of the pool comes up exactly once, in random
 * order. Progress is counted in items, so a matching round counts for 4.
 */
export interface Session {
  rounds: readonly Round[];
  total: number;
  unit: { singular: string; plural: string };
}

const MATCHING_SIZE = 4;
const STOPS_PER_SESSION = 15;

export const roundWeight = (round: Round) => (round.kind === "matching" ? round.round.pairs.length : 1);

const QUESTIONS = { singular: "question", plural: "questions" };

export function createSession(mode: QuizModeId, chapter: Chapter, camera: Camera, rng: Rng = Math.random): Session {
  const choice = (question: ChoiceQuestion): Round => ({ kind: "choice", question });
  const session = (rounds: Round[], unit = QUESTIONS): Session => ({
    rounds,
    total: rounds.reduce((sum, r) => sum + roundWeight(r), 0),
    unit,
  });

  switch (mode) {
    case "stops": {
      const seen = new Set<string>();
      const guide = chapter.guides?.stops;
      const withGuide = (q: ChoiceQuestion): ChoiceQuestion =>
        guide ? { ...q, explanation: { ...q.explanation, more: { paragraphs: guide.paragraphs, illustration: guide.illustration }, moreTitle: "compter les stops" } } : q;
      return session(Array.from({ length: STOPS_PER_SESSION }, () => choice(withGuide(generateStopsQuestion(chapter.stops!, seen, rng)))));
    }
    case "diagnosis":
      return session(shuffle(chapter.diagnoses, rng).map((d) => choice(diagnosisToChoice(d, rng))));
    case "camera":
      return session(shuffle(cameraQuestionsFor(camera, chapter.id), rng).map((q) => choice(mcqToChoice(q, rng, camera))));
    case "vocabulary":
      return session(vocabularyRounds(chapter, camera, rng), { singular: "notion", plural: "notions" });
  }
}

/** Alternates single questions and matching rounds until every term and course question has come up once. */
function vocabularyRounds(chapter: Chapter, camera: Camera, rng: Rng): Round[] {
  const terms: Term[] = shuffle(chapter.vocabulary, rng);
  const questions: McqQuestion[] = shuffle(chapter.questions, rng);
  const rounds: Round[] = [];

  while (terms.length + questions.length > 0) {
    const matchingTurn = rounds.length % 2 === 1 && terms.length >= MATCHING_SIZE;
    if (matchingTurn) {
      rounds.push({ kind: "matching", round: termsToMatching(terms.splice(0, MATCHING_SIZE), rng) });
      continue;
    }
    const pickQuestion = questions.length > 0 && (terms.length === 0 || rng() < questions.length / (questions.length + terms.length));
    rounds.push({
      kind: "choice",
      question: pickQuestion ? mcqToChoice(questions.shift()!, rng, camera) : termToChoice(terms.shift()!, chapter.vocabulary, rng),
    });
  }
  return rounds;
}
