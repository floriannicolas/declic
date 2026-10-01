import type { Camera } from "@/types";
import { d3500 } from "./d3500";

/** The first profile is the default one. */
export const cameras: readonly Camera[] = [d3500];

export function findCamera(id: string | null | undefined): Camera {
  return cameras.find((c) => c.id === id) ?? cameras[0];
}
