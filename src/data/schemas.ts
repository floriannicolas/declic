import { z } from "zod";
import type { Camera, Chapter } from "@/types";
import { isShutterLabel, shutterSeconds } from "@/engine/shutter";

const id = z.string().regex(/^[a-z0-9-]+$/, "identifiant en kebab-case attendu");
const text = z.string().min(1).refine((s) => !s.includes("\u2014"), "tiret cadratin interdit");
const shutterLabel = z.string().refine(isShutterLabel, "libellé de vitesse invalide");
const lensRole = z.enum(["standard-zoom", "fast-prime", "telephoto", "wide-angle"]);
const setting = z.enum(["shutter", "aperture", "iso"]);

const ascending = (values: readonly number[]) => values.every((v, i) => i === 0 || v > values[i - 1]);

const mcq = z.object({
  id,
  prompt: text,
  answer: text,
  distractors: z.tuple([text, text, text]),
  explanation: text,
  keyword: text.optional(),
  chapters: z.array(id).optional(),
});

const lens = z.object({
  id: z.string().min(1),
  name: text,
  role: lensRole,
  focalLengths: z.array(z.number().positive()).min(1),
  maxApertureByFocal: z.record(z.string(), z.number().positive()),
  minAperture: z.number().positive(),
  stabilized: z.boolean(),
  stabilizationStops: z.number().positive().optional(),
  retractable: z.boolean().optional(),
});

export const cameraSchema: z.ZodType<Camera> = z
  .object({
    id,
    brand: text,
    model: text,
    sensor: z.object({ format: text, megapixels: z.number().positive(), cropFactor: z.number().positive() }),
    iso: z.object({ min: z.number(), max: z.number(), scale: z.array(z.number().positive()).min(2).refine(ascending) }),
    shutter: z.object({
      scale: z
        .array(shutterLabel)
        .min(2)
        .refine((labels) => ascending(labels.map((l) => -shutterSeconds(l))), "vitesses de la plus lente à la plus rapide"),
    }),
    aperture: z.object({ scale: z.array(z.number().positive()).min(2).refine(ascending) }),
    burstFps: z.number().positive(),
    afPoints: z.number().int().positive(),
    flashSync: shutterLabel,
    modes: z.array(z.string()),
    hasAfMotor: z.boolean(),
    lenses: z.array(lens).min(1),
    screen: z.object({
      layout: z.tuple([setting, setting, setting]),
      captions: z.object({ shutter: text, aperture: text, iso: text }),
    }),
    controls: z.record(z.string(), z.string()),
    vocabulary: z.record(z.string(), z.string()),
    questions: z.array(mcq),
  })
  .refine((c) => c.iso.scale[0] === c.iso.min && c.iso.scale.at(-1) === c.iso.max, "échelle ISO incohérente avec mini et maxi")
  .refine((c) => new Set(c.screen.layout).size === 3, "les trois molettes doivent apparaître une fois");

const constraint = z.discriminatedUnion("setting", [
  z.object({ setting: z.literal("shutter"), slowest: z.number().positive().optional(), fastest: z.number().positive().optional(), message: text }),
  z.object({ setting: z.literal("aperture"), widest: z.number().positive().optional(), narrowest: z.number().positive().optional(), message: text }),
  z.object({ setting: z.literal("iso"), min: z.number().positive().optional(), max: z.number().positive().optional(), message: text }),
]);

const motion = z.discriminatedUnion("type", [
  z.object({ type: z.literal("none") }),
  z.object({ type: z.literal("subject"), freezeAt: z.number().positive(), direction: z.enum(["horizontal", "vertical"]) }),
  z.object({ type: z.literal("panning"), slowest: z.number().positive(), fastest: z.number().positive() }),
]);

const scenario = z.object({
  id,
  title: text,
  situation: text,
  intent: text,
  lens: z.object({ role: lensRole, focalLength: z.number().positive() }),
  ev: z.number(),
  exposureBias: z.number().optional(),
  support: z.enum(["handheld", "tripod"]),
  constraints: z.array(constraint),
  preview: z.object({
    ambience: z.enum(["daylight", "overcast", "dusk", "blue-hour", "night", "indoor"]),
    subject: z.enum(["cyclist", "golfer", "portrait", "buildings", "mural", "cars", "silhouette", "child", "waterfall", "player", "statue", "walker"]),
    motion,
  }),
  explanation: text,
  keyword: text.optional(),
});

const unique = <T extends { id: string }>(items: readonly T[]) => new Set(items.map((i) => i.id)).size === items.length;

export const chapterSchema: z.ZodType<Chapter> = z.object({
  id,
  number: z.number().int().positive(),
  title: text,
  summary: text,
  scenarios: z.array(scenario).refine(unique, "identifiants de scénario en double"),
  stops: z
    .object({
      apertures: z.array(z.number().positive()).min(4).refine(ascending),
      shutterSpeeds: z.array(shutterLabel).min(4),
      isos: z.array(z.number().positive()).min(4).refine(ascending),
    })
    .optional(),
  vocabulary: z
    .array(z.object({ id, term: text, definition: text, pitfall: text.optional() }))
    .refine(unique, "identifiants de terme en double"),
  questions: z.array(mcq).refine(unique, "identifiants de question en double"),
  diagnoses: z
    .array(z.object({ id, symptom: text, cause: text, wrongCauses: z.tuple([text, text, text]), fix: text }))
    .refine(unique, "identifiants de diagnostic en double"),
});

/** Throws with a readable message if any content file breaks the contract. */
export function validateContent(chapters: readonly Chapter[], cameras: readonly Camera[]): void {
  const errors: string[] = [];
  for (const c of chapters) {
    const r = chapterSchema.safeParse(c);
    if (!r.success) errors.push(`Chapitre ${c.id} :\n${z.prettifyError(r.error)}`);
  }
  for (const c of cameras) {
    const r = cameraSchema.safeParse(c);
    if (!r.success) errors.push(`Appareil ${c.id} :\n${z.prettifyError(r.error)}`);
  }
  if (!unique(chapters)) errors.push("Deux chapitres partagent le même identifiant.");
  if (!unique(cameras)) errors.push("Deux appareils partagent le même identifiant.");
  if (errors.length) throw new Error(`Contenu invalide\n\n${errors.join("\n\n")}`);
}
