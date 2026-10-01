import type { Camera, Chapter, ChoiceQuestion, MatchingRound, McqQuestion, ModeId, Term } from "@/types";
import { cameraQuestionsFor, diagnosisToChoice, mcqToChoice, termsToMatching, termToChoice } from "./questions";
import { Bag, type Rng } from "./random";
import { generateStopsQuestion } from "./stops";

export type Round = { kind: "choice"; question: ChoiceQuestion } | { kind: "matching"; round: MatchingRound };

export type QuizModeId = Exclude<ModeId, "simulator">;

const MATCHING_SIZE = 4;

/** Endless supplier of rounds for a quiz mode, drawn at random without repetition. */
export function createRoundSource(mode: QuizModeId, chapter: Chapter, camera: Camera, rng: Rng = Math.random): () => Round {
  const choice = (question: ChoiceQuestion): Round => ({ kind: "choice", question });

  switch (mode) {
    case "stops": {
      const seen = new Set<string>();
      return () => choice(generateStopsQuestion(chapter.stops!, seen, rng));
    }
    case "diagnosis": {
      const bag = new Bag(chapter.diagnoses, rng);
      return () => choice(diagnosisToChoice(bag.next(), rng));
    }
    case "camera": {
      const bag = new Bag(cameraQuestionsFor(camera, chapter.id), rng);
      return () => choice(mcqToChoice(bag.next(), rng, camera));
    }
    case "vocabulary": {
      type Item = { term: Term } | { question: McqQuestion };
      const items: Item[] = [...chapter.vocabulary.map((term) => ({ term })), ...chapter.questions.map((question) => ({ question }))];
      const bag = new Bag(items, rng);
      const terms = chapter.vocabulary.length >= MATCHING_SIZE ? new Bag(chapter.vocabulary, rng) : null;
      let count = 0;
      return () => {
        count++;
        if (terms && count % 2 === 0) return { kind: "matching", round: termsToMatching(terms.take(MATCHING_SIZE), rng) };
        const item = bag.next();
        return choice("term" in item ? termToChoice(item.term, chapter.vocabulary, rng) : mcqToChoice(item.question, rng, camera));
      };
    }
  }
}
