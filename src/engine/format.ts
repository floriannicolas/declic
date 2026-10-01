const numberFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

export const formatNumber = (x: number) => numberFormat.format(x);

export const formatAperture = (f: number) => `f/${formatNumber(f)}`;

export const formatIso = (iso: number) => `${iso} ISO`;

/** "1/250" stays "1/250 s", "2,5 s" stays as is. */
export const formatShutterLabel = (label: string) => (label.endsWith("s") ? label : `${label} s`);

/** Seconds to a readable label: 0.004 gives "1/250 s", 2.5 gives "2,5 s". */
export function formatSeconds(t: number): string {
  if (t >= 0.95) return `${formatNumber(Math.round(t * 10) / 10)} s`;
  const denominator = 1 / t;
  const rounded = denominator < 10 ? Math.round(denominator * 10) / 10 : Math.round(denominator);
  return `1/${formatNumber(rounded)} s`;
}

/** Stop amount rounded to the nearest third: "2/3 de stop", "1 stop 1/3", "3 stops". */
export function formatStops(x: number): string {
  const thirds = Math.round(Math.abs(x) * 3);
  const whole = Math.floor(thirds / 3);
  const rest = thirds % 3;
  const fraction = rest === 0 ? "" : `${rest}/3`;
  if (whole === 0) return fraction ? `${fraction} de stop` : "0 stop";
  const unit = whole > 1 ? "stops" : "stop";
  return fraction ? `${whole} ${unit} ${fraction}` : `${whole} ${unit}`;
}

export const plural = (n: number, singular: string, pluralForm = `${singular}s`) =>
  `${n} ${n > 1 ? pluralForm : singular}`;
