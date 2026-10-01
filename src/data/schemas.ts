import { z } from "zod";
import type { Camera, Chapter } from "@/types";
import { BODY_ANCHORS } from "@/types/camera";
import { ILLUSTRATION_IDS } from "@/types/question";
import { isShutterLabel, shutterSeconds } from "@/engine/shutter";
import { photoCredits } from "./photo-credits";

const id = z.string().regex(/^[a-z0-9-]+$/, "identifiant en kebab-case attendu");
const text = z.string().min(1).refine((s) => !s.includes("\u2014"), "tiret cadratin interdit");
const shutterLabel = z.string().refine(isShutterLabel, "libellé de vitesse invalide");
const lensRole = z.enum(["standard-zoom", "fast-prime", "telephoto", "wide-angle"]);
const setting = z.enum(["shutter", "aperture", "iso"]);

const more = z
  .object({ paragraphs: z.array(text).min(1), illustration: z.enum(ILLUSTRATION_IDS).optional() })
  .optional();

const unique = <T extends { id: string }>(items: readonly T[]) => new Set(items.map((i) => i.id)).size === items.length;

const ascending = (values: readonly number[]) => values.every((v, i) => i === 0 || v > values[i - 1]);

const mcq = z.object({
  id,
  prompt: text,
  answer: text,
  distractors: z.tuple([text, text, text]),
  explanation: text,
  keyword: text.optional(),
  chapters: z.array(id).optional(),
  more,
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
    parts: z
      .array(
        z.object({ id, anchor: z.enum(BODY_ANCHORS), name: text, role: text, tip: text.optional(), terms: z.array(id).optional() }),
      )
      .refine(unique, "identifiants de pièce en double")
      .optional(),
    model3d: z
      .object({
        src: z.string().regex(/^\/models\/[a-z0-9-]+\.glb$/, "chemin /models/....glb attendu"),
        label: text,
        credit: z.object({ author: text, license: text, licenseUrl: z.url(), sourceUrl: z.url(), changes: text }),
        rotation: z.tuple([z.number(), z.number(), z.number()]).optional(),
        spots: z.partialRecord(
          z.enum(BODY_ANCHORS),
          z.object({ position: z.tuple([z.number(), z.number(), z.number()]), normal: z.tuple([z.number(), z.number(), z.number()]) }),
        ),
      })
      .optional(),
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
  z.object({
    type: z.literal("subject"),
    freezeAt: z.number().positive(),
    direction: z.enum(["horizontal", "vertical"]),
    angle: z.number().min(-180).max(360).optional(),
  }),
  z.object({ type: z.literal("panning"), slowest: z.number().positive(), fastest: z.number().positive() }),
]);

const placement = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("fill") }),
  z.object({ kind: z.literal("box"), centerX: z.number().min(0).max(1), bottom: z.number().min(0).max(1.2), height: z.number().positive().max(1.5) }),
]);

const photoPath = z.string().regex(/^\/photos\/[a-z0-9-]+\.(webp|jpg|png)$/, "chemin /photos/... attendu");

const previewPhoto = z.object({
  background: photoPath,
  subject: z.object({ src: photoPath, placement, silhouette: z.boolean().optional(), flip: z.boolean().optional() }).optional(),
  credits: z.array(z.string()).min(1).refine((keys) => keys.every((k) => k in photoCredits), "crédit photo inconnu"),
});

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
    photo: previewPhoto.optional(),
  }),
  explanation: text,
  keyword: text.optional(),
});


const guide = z.object({
  title: text,
  paragraphs: z.array(text).min(1),
  illustration: z.enum(ILLUSTRATION_IDS).optional(),
  terms: z.array(id).optional(),
});

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
    .array(z.object({ id, term: text, definition: text, pitfall: text.optional(), more }))
    .refine(unique, "identifiants de terme en double"),
  questions: z.array(mcq).refine(unique, "identifiants de question en double"),
  diagnoses: z
    .array(z.object({ id, symptom: text, cause: text, wrongCauses: z.tuple([text, text, text]), fix: text, more }))
    .refine(unique, "identifiants de diagnostic en double"),
  guides: z.partialRecord(z.enum(["shutter", "aperture", "iso", "stops", "simulator"]), guide).optional(),
}).refine(
  (c) => Object.values(c.guides ?? {}).every((g) => (g?.terms ?? []).every((t) => c.vocabulary.some((v) => v.id === t))),
  "un guide cite un terme absent du vocabulaire",
);

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
