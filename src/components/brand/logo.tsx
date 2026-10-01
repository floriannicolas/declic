const BLADES = 6;
const CENTER = 32;
const RIM = 21;
const HOLE = 7.5;

/** Hexagon vertex k of the aperture hole. */
const hole = (k: number, r = HOLE): [number, number] => {
  const a = (Math.PI / 3) * k - Math.PI / 2;
  return [CENTER + r * Math.cos(a), CENTER + r * Math.sin(a)];
};

/**
 * Each blade's inner edge is one side of the hexagonal hole, extended until it
 * meets the rim: the classic pinwheel look of a lens diaphragm.
 */
function bladePath(k: number) {
  const [x0, y0] = hole(k);
  const [x1, y1] = hole(k + 1);
  const dx = x1 - x0;
  const dy = y1 - y0;
  // Extend the side beyond its end vertex until the rim.
  const fx = x1 - CENTER;
  const fy = y1 - CENTER;
  const b = fx * dx + fy * dy;
  const c = fx * fx + fy * fy - RIM * RIM;
  const t = (-b + Math.sqrt(b * b - (dx * dx + dy * dy) * c)) / (dx * dx + dy * dy);
  const ex = x1 + dx * t;
  const ey = y1 + dy * t;
  // Back along the rim to the extension of the previous side.
  const [px, py] = hole(k - 1);
  const qdx = x0 - px;
  const qdy = y0 - py;
  const gx = x0 - CENTER;
  const gy = y0 - CENTER;
  const qb = gx * qdx + gy * qdy;
  const qc = gx * gx + gy * gy - RIM * RIM;
  const qt = (-qb + Math.sqrt(qb * qb - (qdx * qdx + qdy * qdy) * qc)) / (qdx * qdx + qdy * qdy);
  const sx = x0 + qdx * qt;
  const sy = y0 + qdy * qt;
  const f = (n: number) => n.toFixed(2);
  return `M ${f(x0)} ${f(y0)} L ${f(x1)} ${f(y1)} L ${f(ex)} ${f(ey)} A ${RIM} ${RIM} 0 0 0 ${f(sx)} ${f(sy)} Z`;
}

const PATHS = Array.from({ length: BLADES }, (_, k) => bladePath(k));
const HEXAGON = Array.from({ length: BLADES }, (_, k) => hole(k).map((n) => n.toFixed(2)).join(" ")).join(" ");
const SHADES = ["#ffb020", "#f2a314", "#ffc04d", "#e8970c", "#ffb733", "#f0a01a"];

/**
 * Déclic logo: a lens diaphragm in an app style tile. When `animated`, it
 * "clicks" once every 12 s (blades twist shut and reopen, then a glint), and
 * stays still in between so it never reads as a loading spinner.
 */
export function Logo({ size = 48, animated = false, title = "Déclic" }: { size?: number; animated?: boolean; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
      className={animated ? "logo-animated" : undefined}
    >
      <defs>
        <linearGradient id="logo-tile" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#262930" />
          <stop offset="1" stopColor="#0d0e10" />
        </linearGradient>
        <clipPath id="logo-lens">
          <circle cx={CENTER} cy={CENTER} r={RIM} />
        </clipPath>
      </defs>
      <rect x="1" y="1" width="62" height="62" rx="15" fill="url(#logo-tile)" stroke="#2b2f36" strokeWidth="1" />
      <circle cx={CENTER} cy={CENTER} r={RIM + 3.5} fill="#0b0c0f" stroke="#3a3d44" strokeWidth="1.5" />
      <g clipPath="url(#logo-lens)">
        {/* Blade colour behind the opening: visible when the hole shrinks, so the shutter reads as closed. */}
        <circle cx={CENTER} cy={CENTER} r={RIM} fill="#e8970c" />
        <g className="logo-iris">
          {PATHS.map((d, k) => (
            <path key={k} d={d} fill={SHADES[k]} stroke="#7a4b00" strokeWidth="0.6" strokeLinejoin="round" />
          ))}
        </g>
        <polygon className="logo-hole" points={HEXAGON} fill="#0b0c0f" />
      </g>
      <circle cx={CENTER} cy={CENTER} r={RIM} fill="none" stroke="#0b0c0f" strokeWidth="1.2" />
      {/* Glint after the click */}
      <path className="logo-glint" d="M 50 9 L 51.4 12.6 L 55 14 L 51.4 15.4 L 50 19 L 48.6 15.4 L 45 14 L 48.6 12.6 Z" fill="#fff6dc" opacity="0" />
    </svg>
  );
}
