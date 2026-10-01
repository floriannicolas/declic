import type { ShutterLabel } from "@/types";

const LABEL = /^(?:(\d+(?:,\d+)?) s|1\/(\d+(?:,\d+)?))$/;

export const isShutterLabel = (label: string) => LABEL.test(label);

/** Duration in seconds of a label such as "30 s", "2,5 s", "1/1,3" or "1/250". */
export function shutterSeconds(label: ShutterLabel): number {
  const match = LABEL.exec(label);
  if (!match) throw new Error(`Libellé de vitesse invalide : « ${label} »`);
  const [, seconds, denominator] = match;
  const parse = (s: string) => Number(s.replace(",", "."));
  return seconds !== undefined ? parse(seconds) : 1 / parse(denominator);
}
