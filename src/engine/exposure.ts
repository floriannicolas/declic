import { formatStops } from "./format";

/** EV of a setting triplet, brought back to ISO 100: log2(N² / t) - log2(ISO / 100). */
export function settingsEv(fNumber: number, seconds: number, iso: number): number {
  return Math.log2((fNumber * fNumber) / seconds) - Math.log2(iso / 100);
}

/**
 * Marked values (f/5.6, 1/125...) are rounded versions of powers of two.
 * Snapping to the nearest third removes that noise before comparing.
 */
export const snapToThird = (x: number) => Math.round(x * 3) / 3;

const THIRD = 1 / 3 + 1e-9;

export type ExposureVerdict = "correct" | "close" | "over" | "under";

export interface ExposureJudgement {
  ev: number;
  targetEv: number;
  /** Positive: settings let in less light than needed, the photo is too dark. */
  offset: number;
  verdict: ExposureVerdict;
  label: string;
}

export function judgeExposure(ev: number, targetEv: number): ExposureJudgement {
  const offset = snapToThird(ev) - targetEv;
  const amount = formatStops(offset);
  const direction = offset > 0 ? "sous-exposée" : "surexposée";

  if (Math.abs(offset) <= THIRD) {
    const label = Math.abs(offset) < 1e-9 ? "Exposition juste" : `Exposition juste (${amount} d'écart, dans la tolérance)`;
    return { ev, targetEv, offset, verdict: "correct", label };
  }
  if (Math.abs(offset) <= 1 + 1e-9) {
    return { ev, targetEv, offset, verdict: "close", label: `Presque : ${direction} de ${amount}` };
  }
  return {
    ev,
    targetEv,
    offset,
    verdict: offset > 0 ? "under" : "over",
    label: `${direction[0].toUpperCase()}${direction.slice(1)} de ${amount}`,
  };
}
