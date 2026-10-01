import type { Camera, ChoiceQuestion, Diagnosis, MatchingRound, McqQuestion, Term } from "@/types";
import { shuffle, type Rng } from "./random";
import { fillTemplate } from "./template";

function toChoice(
  id: string,
  prompt: string,
  answer: string,
  distractors: readonly string[],
  explanation: ChoiceQuestion["explanation"],
  rng: Rng,
): ChoiceQuestion {
  const options = shuffle(
    [answer, ...distractors].map((text, i) => ({ id: `${id}:${i}`, text })),
    rng,
  );
  return { id, prompt, options, answerId: `${id}:0`, explanation };
}

export function mcqToChoice(q: McqQuestion, rng: Rng, camera?: Camera): ChoiceQuestion {
  const fill = (s: string) => (camera ? fillTemplate(s, camera) : s);
  return toChoice(q.id, fill(q.prompt), fill(q.answer), q.distractors.map(fill), {
    text: fill(q.explanation),
    keyword: q.keyword && fill(q.keyword),
  }, rng);
}

export function termToChoice(term: Term, allTerms: readonly Term[], rng: Rng): ChoiceQuestion {
  const others = shuffle(allTerms.filter((t) => t.id !== term.id), rng).slice(0, 3);
  return toChoice(
    `term:${term.id}`,
    `Que désigne « ${term.term} » ?`,
    term.definition,
    others.map((t) => t.definition),
    {
      text: `${term.term} : ${term.definition}`,
      keyword: term.term,
      extra: term.pitfall ? { title: "Piège", text: term.pitfall } : undefined,
    },
    rng,
  );
}

export function termsToMatching(terms: readonly Term[], rng: Rng): MatchingRound {
  const pairs = terms.map((t) => ({ id: t.id, term: t.term, definition: t.definition, pitfall: t.pitfall }));
  return {
    id: `match:${terms.map((t) => t.id).join("+")}`,
    pairs,
    definitionOrder: shuffle(pairs.map((p) => p.id), rng),
  };
}

export function diagnosisToChoice(d: Diagnosis, rng: Rng): ChoiceQuestion {
  return toChoice(`diag:${d.id}`, d.symptom, d.cause, d.wrongCauses, {
    text: `La cause : ${d.cause.charAt(0).toLowerCase()}${d.cause.slice(1)}.`,
    keyword: d.cause.charAt(0).toLowerCase() + d.cause.slice(1),
    extra: { title: "Correction", text: d.fix },
  }, rng);
}

/** Camera questions apply to every chapter unless they list some. */
export function cameraQuestionsFor(camera: Camera, chapterId: string): McqQuestion[] {
  return camera.questions.filter((q) => !q.chapters || q.chapters.includes(chapterId));
}
