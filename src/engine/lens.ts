import type { Camera, Lens, Scenario } from "@/types";
import { formatAperture } from "./format";

export interface MountedLens {
  lens: Lens;
  focalLength: number;
  maxAperture: number;
}

const EPSILON = 0.01;

/** Widest aperture at a focal length: the closest table entry at or below it. */
export function maxApertureAt(lens: Lens, focalLength: number): number {
  const entries = Object.entries(lens.maxApertureByFocal)
    .map(([focal, f]) => [Number(focal), f] as const)
    .sort((a, b) => a[0] - b[0]);
  const below = entries.filter(([focal]) => focal <= focalLength + EPSILON);
  return (below.at(-1) ?? entries[0])[1];
}

/** Picks the lens playing the requested role, or failing that the one covering the focal length. */
export function mountLens(camera: Camera, request: Scenario["lens"]): MountedLens {
  const covers = (l: Lens) =>
    request.focalLength >= Math.min(...l.focalLengths) && request.focalLength <= Math.max(...l.focalLengths);
  const lens =
    camera.lenses.find((l) => l.role === request.role) ?? camera.lenses.find(covers) ?? camera.lenses[0];
  const focalLength = Math.min(Math.max(request.focalLength, Math.min(...lens.focalLengths)), Math.max(...lens.focalLengths));
  return { lens, focalLength, maxAperture: maxApertureAt(lens, focalLength) };
}

/** Indices of the camera aperture scale reachable with this lens at this focal length. */
export function apertureRange(camera: Camera, mounted: MountedLens): { min: number; max: number } {
  const scale = camera.aperture.scale;
  const min = scale.findIndex((f) => f >= mounted.maxAperture - EPSILON);
  const max = scale.findLastIndex((f) => f <= mounted.lens.minAperture + EPSILON);
  return { min: Math.max(0, min), max: max === -1 ? scale.length - 1 : max };
}

export function wideLimitMessage(mounted: MountedLens): string {
  const { lens, focalLength, maxAperture } = mounted;
  const head = `L'objectif ${lens.name} ne s'ouvre pas au-delà de ${formatAperture(maxAperture)} à ${focalLength} mm.`;
  const steps = Object.entries(lens.maxApertureByFocal)
    .map(([focal, f]) => [Number(focal), f] as const)
    .sort((a, b) => a[0] - b[0]);
  const first = steps[0];
  const last = steps.at(-1)!;
  if (first[1] === last[1]) return `${head} Son ouverture maximale est constante, c'est sa limite physique.`;
  return `${head} Son ouverture maximale varie avec la focale : ${formatAperture(first[1])} à ${first[0]} mm, ${formatAperture(last[1])} à ${last[0]} mm.`;
}

export function narrowLimitMessage(mounted: MountedLens): string {
  return `L'objectif ${mounted.lens.name} ne ferme pas au-delà de ${formatAperture(mounted.lens.minAperture)}.`;
}
