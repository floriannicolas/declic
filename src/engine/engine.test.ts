import { describe, expect, it } from "vitest";
import { cameras } from "@/data/cameras";
import { d3500 } from "@/data/cameras/d3500";
import { chapters } from "@/data/chapters";
import { chapter1 } from "@/data/chapters/chapter-1";
import { validateContent } from "@/data/schemas";
import type { Camera } from "@/types";
import { judgeExposure, settingsEv } from "./exposure";
import { formatSeconds, formatStops } from "./format";
import { maxApertureAt, mountLens } from "./lens";
import { availableModes } from "./modes";
import { Bag } from "./random";
import { applyOutcome, initialScore, multiplier } from "./scoring";
import { shutterSeconds } from "./shutter";
import { evaluateScenario, findSolution, setupSimulator, type SettingIndices } from "./simulator";
import { generateStopsQuestion } from "./stops";
import { createSession } from "./rounds";

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

function indicesFor(setup: ReturnType<typeof setupSimulator>, label: string, f: number, iso: number): SettingIndices {
  return {
    shutter: setup.camera.shutter.scale.indexOf(label),
    aperture: setup.camera.aperture.scale.indexOf(f),
    iso: setup.camera.iso.scale.indexOf(iso),
  };
}

describe("contenu", () => {
  it("respecte le contrat des schémas", () => {
    expect(() => validateContent(chapters, cameras)).not.toThrow();
  });

  it("propose les cinq modes pour le chapitre 1", () => {
    expect(availableModes(chapter1, d3500).map((m) => m.id)).toEqual([
      "simulator",
      "stops",
      "vocabulary",
      "diagnosis",
      "camera",
    ]);
  });
});

describe("exposition", () => {
  it("lit les libellés de vitesse", () => {
    expect(shutterSeconds("30 s")).toBe(30);
    expect(shutterSeconds("2,5 s")).toBe(2.5);
    expect(shutterSeconds("1/1,3")).toBeCloseTo(0.769, 3);
    expect(shutterSeconds("1/4000")).toBe(1 / 4000);
  });

  it("calcule l'EV des réglages", () => {
    expect(settingsEv(8, 1, 100)).toBe(6);
    expect(settingsEv(16, 1 / 250, 100)).toBeCloseTo(15.97, 2);
    expect(settingsEv(2, 1 / 125, 400)).toBeCloseTo(6.97, 2);
  });

  it("classe l'écart en juste, presque, sur ou sous", () => {
    expect(judgeExposure(10.3, 10).verdict).toBe("correct");
    expect(judgeExposure(9.4, 10).verdict).toBe("close");
    expect(judgeExposure(11.7, 10).verdict).toBe("under");
    expect(judgeExposure(11.7, 10).label).toBe("Sous-exposée de 1 stop 2/3");
    expect(judgeExposure(8, 10).verdict).toBe("over");
  });

  it("formate stops et vitesses", () => {
    expect(formatStops(1 / 3)).toBe("1/3 de stop");
    expect(formatStops(-2)).toBe("2 stops");
    expect(formatStops(1.34)).toBe("1 stop 1/3");
    expect(formatSeconds(1 / 250)).toBe("1/250 s");
    expect(formatSeconds(2.5)).toBe("2,5 s");
  });
});

describe("objectifs", () => {
  it("lit l'ouverture maximale selon la focale", () => {
    const zoom = d3500.lenses[0];
    expect(maxApertureAt(zoom, 18)).toBe(3.5);
    expect(maxApertureAt(zoom, 55)).toBe(5.6);
    expect(maxApertureAt(zoom, 40)).toBe(4.5);
  });

  it("refuse f/1.8 sur le zoom et l'explique", () => {
    const scenario = chapter1.scenarios.find((s) => s.id === "golf-swing")!;
    const setup = setupSimulator(d3500, scenario);
    expect(setup.scales.aperture.values[setup.scales.aperture.min]).toBe(5.6);
    expect(setup.scales.aperture.limitMessage("low")).toContain("f/5,6 à 55 mm");
    expect(mountLens(d3500, { role: "fast-prime", focalLength: 35 }).maxAperture).toBe(1.8);
  });
});

describe("simulateur, scénarios du chapitre 1", () => {
  const cases: [string, string, number, number][] = [
    ["panning-cyclist", "1/30", 5.6, 100],
    ["golf-swing", "1/1000", 5.6, 200],
    ["portrait-blur", "1/250", 2.8, 100],
    ["city-landscape", "1/500", 8, 100],
    ["blue-hour-mural", "1/40", 3.5, 200],
    ["light-trails", "1 s", 8, 100],
    ["dusk-silhouette", "1/15", 8, 100],
    ["indoor-child", "1/125", 2, 400],
  ];

  it.each(cases)("%s : %s à f/%s, ISO %s est juste", (id, shutter, f, iso) => {
    const setup = setupSimulator(d3500, chapter1.scenarios.find((s) => s.id === id)!);
    const result = evaluateScenario(setup, indicesFor(setup, shutter, f, iso));
    expect(result.exposure.verdict).toBe("correct");
    expect(result.outcome).toBe("correct");
  });

  it("signale la contrainte de filé quand la vitesse est trop rapide", () => {
    const setup = setupSimulator(d3500, chapter1.scenarios[0]);
    const result = evaluateScenario(setup, indicesFor(setup, "1/250", 2.2, 100));
    expect(result.exposure.verdict).toBe("correct");
    expect(result.constraints.find((c) => !c.met)?.detail).toContain("entre 1/40 s et 1/15 s");
  });

  it("vise une sous-exposition d'un stop pour la silhouette", () => {
    const setup = setupSimulator(d3500, chapter1.scenarios.find((s) => s.id === "dusk-silhouette")!);
    expect(setup.targetEv).toBe(10);
    const atMeter = evaluateScenario(setup, indicesFor(setup, "1/8", 8, 100));
    expect(atMeter.exposure.verdict).toBe("close");
  });

  it("chaque scénario a au moins une solution sur chaque profil", () => {
    for (const camera of cameras)
      for (const scenario of chapters.flatMap((c) => c.scenarios))
        expect(findSolution(setupSimulator(camera, scenario)), `${camera.id} / ${scenario.id}`).not.toBeNull();
  });
});

describe("score et tirage", () => {
  it("applique le multiplicateur de série", () => {
    expect([1, 2, 3, 4, 5, 6].map(multiplier)).toEqual([1, 1, 1.5, 1.5, 2, 2]);
    let state = initialScore;
    const gains: number[] = [];
    for (let i = 0; i < 5; i++) {
      const r = applyOutcome(state, "correct");
      gains.push(r.gain);
      state = r.state;
    }
    expect(gains).toEqual([10, 10, 15, 15, 20]);
    expect(applyOutcome(state, "wrong").state.streak).toBe(0);
    expect(applyOutcome(state, "wrong").state.bestStreak).toBe(5);
  });

  it("ne répète rien avant d'avoir épuisé le pool", () => {
    const bag = new Bag([1, 2, 3, 4, 5], seeded(42));
    const first = Array.from({ length: 5 }, () => bag.next());
    expect(new Set(first).size).toBe(5);
    expect(bag.next()).not.toBe(first[4]);
  });

  it("génère des questions de stops valides et sans doublon d'options", () => {
    const seen = new Set<string>();
    const rng = seeded(7);
    for (let i = 0; i < 200; i++) {
      const q = generateStopsQuestion(chapter1.stops!, seen, rng);
      expect(q.options.length).toBe(4);
      expect(new Set(q.options.map((o) => o.text)).size).toBe(4);
      expect(q.options.some((o) => o.id === q.answerId)).toBe(true);
    }
  });
});

describe("indépendance vis-à-vis du boîtier", () => {
  const fullFrame: Camera = {
    ...d3500,
    id: "fictif",
    brand: "Canon",
    model: "R8",
    sensor: { format: "plein format", megapixels: 24, cropFactor: 1 },
    shutter: { scale: [...d3500.shutter.scale.slice(0, -1), "1/5000", "1/6400", "1/8000"] },
    iso: { min: 100, max: 102400, scale: [...d3500.iso.scale, 32000, 40000, 51200, 64000, 80000, 102400] },
    lenses: [
      { id: "24-105", name: "RF 24-105 mm f/4-7.1", role: "standard-zoom", focalLengths: [24, 105], maxApertureByFocal: { 24: 4, 50: 5.6, 105: 7.1 }, minAperture: 32, stabilized: true, stabilizationStops: 5 },
      { id: "50", name: "RF 50 mm f/1.8", role: "fast-prime", focalLengths: [50], maxApertureByFocal: { 50: 1.8 }, minAperture: 22, stabilized: false },
    ],
    screen: { layout: ["aperture", "shutter", "iso"], captions: { shutter: "Tv", aperture: "Av", iso: "ISO" } },
  };

  it("lit les limites et l'objectif depuis le profil", () => {
    const golf = chapter1.scenarios.find((s) => s.id === "golf-swing")!;
    const setup = setupSimulator(fullFrame, golf);
    expect(setup.mounted.lens.id).toBe("24-105");
    expect(setup.mounted.focalLength).toBe(55);
    expect(setup.mounted.maxAperture).toBe(5.6);
    expect(setup.scales.shutter.labels.at(-1)).toBe("1/8000");
    expect(setup.scales.iso.limitMessage("high")).toContain("R8");
    expect(setup.scales.aperture.values[setup.scales.aperture.max]).toBe(32);
    expect(() => validateContent(chapters, [fullFrame])).not.toThrow();
  });
});

describe("sessions", () => {
  it("passe chaque notion du vocabulaire exactement une fois", () => {
    const session = createSession("vocabulary", chapter1, d3500, seeded(3));
    const ids = session.rounds.flatMap((r) => (r.kind === "matching" ? r.round.pairs.map((p) => `term:${p.id}`) : [r.question.id]));
    expect(ids.length).toBe(chapter1.vocabulary.length + chapter1.questions.length);
    expect(new Set(ids).size).toBe(ids.length);
    expect(session.total).toBe(ids.length);
    expect(session.rounds.some((r) => r.kind === "matching")).toBe(true);
  });

  it("borne les autres modes à leur pool", () => {
    expect(createSession("diagnosis", chapter1, d3500).total).toBe(chapter1.diagnoses.length);
    expect(createSession("camera", chapter1, d3500).total).toBe(d3500.questions.length);
    expect(createSession("stops", chapter1, d3500).total).toBe(15);
  });
});
