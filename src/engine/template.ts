import type { Camera } from "@/types";
import { formatNumber, formatShutterLabel } from "./format";
import type { MountedLens } from "./lens";

/** Resolves the {placeholders} of a text against the camera profile, so chapters stay camera agnostic. */
export function fillTemplate(text: string, camera: Camera, mounted?: MountedLens): string {
  const values: Record<string, string | undefined> = {
    model: camera.model,
    brand: camera.brand,
    maxShutter: formatShutterLabel(camera.shutter.scale.at(-1) ?? ""),
    stabilization: camera.vocabulary.stabilization ?? "stabilisation",
    lens: mounted?.lens.name,
    maxAperture: mounted ? formatNumber(mounted.maxAperture) : undefined,
  };
  return text.replace(/\{(\w+)\}/g, (whole, key: string) => values[key] ?? whole);
}
