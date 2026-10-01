import type { ChoiceQuestion, StopScales } from "@/types";
import { formatAperture, formatShutterLabel, plural } from "./format";
import { pick, randomInt, shuffle, type Rng } from "./random";

type Axis = "aperture" | "shutter" | "iso";

interface AxisInfo {
  labels: readonly string[];
  /** +1 if moving up the scale lets in more light, -1 otherwise. */
  lightDirection: 1 | -1;
}

/** Scales are ordered: apertures wide to narrow, speeds fast to slow, ISO low to high. */
function axes(scales: StopScales): Record<Axis, AxisInfo> {
  return {
    aperture: { labels: scales.apertures.map(formatAperture), lightDirection: -1 },
    shutter: { labels: scales.shutterSpeeds.map(formatShutterLabel), lightDirection: 1 },
    iso: { labels: scales.isos.map((iso) => `${iso} ISO`), lightDirection: 1 },
  };
}

const path = (labels: readonly string[], from: number, to: number) => {
  const step = from < to ? 1 : -1;
  const parts: string[] = [];
  for (let i = from; i !== to + step; i += step) parts.push(labels[i]);
  return parts.join(" → ");
};

const stopsWord = (n: number, gained: boolean) => `${plural(n, "stop")} ${gained ? "gagné" : "perdu"}${n > 1 ? "s" : ""}`;

const AXIS_RULE: Record<Axis, string> = {
  aperture:
    "Sur l'échelle des ouvertures pleines, chaque cran multiplie le nombre f par 1,41 (racine de 2) et divise la lumière par deux. Aller vers les petits nombres, c'est ouvrir.",
  shutter: "Chaque vitesse pleine dure deux fois plus (ou deux fois moins) que sa voisine, donc double (ou divise par deux) la lumière.",
  iso: "Doubler l'ISO double la luminosité de l'image : chaque cran est un stop.",
};

function differenceQuestion(scales: StopScales, rng: Rng): ChoiceQuestion {
  const axis = pick<Axis>(["aperture", "shutter", "iso"], rng);
  const { labels, lightDirection } = axes(scales)[axis];
  const n = randomInt(1, Math.min(3, labels.length - 1), rng);
  const from = randomInt(0, labels.length - 1 - n, rng);
  const [a, b] = rng() < 0.5 ? [from, from + n] : [from + n, from];
  const gained = Math.sign(b - a) === lightDirection;

  const correct = stopsWord(n, gained);
  const candidates = [stopsWord(n, !gained), stopsWord(n + 1, gained), n > 1 ? stopsWord(n - 1, gained) : stopsWord(n + 2, gained)];

  return {
    id: `stops:diff:${axis}:${a}:${b}`,
    prompt: `Tu passes de ${labels[a]} à ${labels[b]}. De combien de stops de lumière as-tu gagné ou perdu ?`,
    ...options(`stops:diff:${axis}:${a}:${b}`, correct, candidates, rng),
    explanation: {
      text: `${AXIS_RULE[axis]} Ici : ${path(labels, a, b)}, soit ${plural(n, "cran")}, donc ${correct}.`,
      keyword: correct,
    },
  };
}

function compensateShutterQuestion(scales: StopScales, rng: Rng): ChoiceQuestion {
  const { labels } = axes(scales).shutter;
  const n = randomInt(1, 3, rng);
  const opening = rng() < 0.5;
  // Opening lets in more light, so the shutter must go faster (down the scale).
  const delta = opening ? -n : n;
  const start = randomInt(Math.max(0, -delta), Math.min(labels.length - 1, labels.length - 1 - delta), rng);
  const target = start + delta;
  const wrongWay = start - delta;

  const candidates = [target - 1, target + 1, wrongWay]
    .filter((i) => i >= 0 && i < labels.length && i !== target)
    .map((i) => labels[i]);
  const filler = [target - 2, target + 2, start].filter((i) => i >= 0 && i < labels.length).map((i) => labels[i]);

  const verb = opening ? "ouvres" : "fermes";
  const factor = 2 ** n;
  return {
    id: `stops:shutter:${opening}:${n}:${start}`,
    prompt: `Tu ${verb} de ${plural(n, "stop")}. Pour garder la même exposition, que devient la vitesse de ${labels[start]} ?`,
    ...options(`stops:shutter:${opening}:${n}:${start}`, labels[target], [...candidates, ...filler], rng, labels),
    explanation: {
      text: `${opening ? "Ouvrir" : "Fermer"} de ${plural(n, "stop")} fait entrer ${factor} fois ${opening ? "plus" : "moins"} de lumière. Pour compenser, la pose doit être ${factor} fois plus ${opening ? "courte" : "longue"} : ${path(labels, start, target)}.`,
      keyword: path(labels, start, target),
    },
  };
}

function compensateIsoQuestion(scales: StopScales, rng: Rng): ChoiceQuestion {
  const shutter = axes(scales).shutter.labels;
  const isos = axes(scales).iso.labels;
  const n = randomInt(1, 3, rng);
  const slower = rng() < 0.5;
  const isoDelta = slower ? -n : n;
  const isoStart = randomInt(Math.max(0, -isoDelta), Math.min(isos.length - 1, isos.length - 1 - isoDelta), rng);
  const isoTarget = isoStart + isoDelta;
  const shutterDelta = slower ? n : -n;
  const shutterStart = randomInt(Math.max(0, -shutterDelta), Math.min(shutter.length - 1, shutter.length - 1 - shutterDelta), rng);
  const shutterTarget = shutterStart + shutterDelta;

  const candidates = [isoTarget - 1, isoTarget + 1, isoStart - isoDelta, isoStart]
    .filter((i) => i >= 0 && i < isos.length && i !== isoTarget)
    .map((i) => isos[i]);

  const factor = 2 ** n;
  return {
    id: `stops:iso:${shutterStart}:${shutterTarget}:${isoStart}`,
    prompt: `Tu passes de ${shutter[shutterStart]} à ${shutter[shutterTarget]} et tu veux compenser avec l'ISO, qui est à ${isos[isoStart]}. Quelle nouvelle valeur ?`,
    ...options(`stops:iso:${shutterStart}:${shutterTarget}:${isoStart}`, isos[isoTarget], candidates, rng, isos),
    explanation: {
      text: `De ${shutter[shutterStart]} à ${shutter[shutterTarget]}, la pose est ${plural(n, "stop")} plus ${slower ? "longue" : "courte"} : ${factor} fois ${slower ? "plus" : "moins"} de lumière. Pour garder la même exposition, l'ISO ${slower ? "baisse" : "monte"} d'autant : ${path(isos, isoStart, isoTarget)}.`,
      keyword: path(isos, isoStart, isoTarget),
    },
  };
}

/** Completes the distractors with the closest values of the scale when the candidates run short (scale ends). */
function options(id: string, correct: string, candidates: readonly string[], rng: Rng, scale: readonly string[] = []) {
  const at = scale.indexOf(correct);
  const nearest = [...scale].sort((a, b) => Math.abs(scale.indexOf(a) - at) - Math.abs(scale.indexOf(b) - at));
  const distractors = [...new Set([...candidates, ...nearest])].filter((c) => c !== correct).slice(0, 3);
  const all = shuffle([correct, ...distractors].map((text, i) => ({ id: `${id}:${i}`, text })), rng);
  return { options: all, answerId: `${id}:0` };
}

const FORMS = [differenceQuestion, compensateShutterQuestion, compensateIsoQuestion];

/** Procedural pool: avoids repeating a question until `seen` is reset by the caller. */
export function generateStopsQuestion(scales: StopScales, seen: Set<string>, rng: Rng = Math.random): ChoiceQuestion {
  for (let attempt = 0; attempt < 50; attempt++) {
    const question = pick(FORMS, rng)(scales, rng);
    if (!seen.has(question.id)) {
      seen.add(question.id);
      return question;
    }
  }
  seen.clear();
  return generateStopsQuestion(scales, seen, rng);
}
