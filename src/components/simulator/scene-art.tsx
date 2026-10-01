import type { Ambience, PreviewSubject } from "@/types";

/** Flat schematic drawings for a 360 x 240 viewBox. Purely presentational. */

export const VIEW = { width: 360, height: 240 } as const;

interface Palette {
  sky: [string, string];
  far: string;
  near: string;
  ground: string;
  window: string;
  lights: number;
  light: string;
}

export const PALETTES: Record<Ambience, Palette> = {
  daylight: { sky: ["#6fa8e8", "#d4e8fb"], far: "#9fb2c6", near: "#6c8399", ground: "#7c9a62", window: "#c7dcef", lights: 0, light: "#ffffff" },
  overcast: { sky: ["#8f99a4", "#cdd2d7"], far: "#8a949e", near: "#66717b", ground: "#62735a", window: "#aeb8c1", lights: 0, light: "#ffffff" },
  dusk: { sky: ["#3b2c62", "#f39257"], far: "#4b3a60", near: "#2d2442", ground: "#2a2234", window: "#ffc77a", lights: 6, light: "#ffd38a" },
  "blue-hour": { sky: ["#132449", "#4672b0"], far: "#22314f", near: "#17213a", ground: "#18202f", window: "#ffd27a", lights: 12, light: "#ffd27a" },
  night: { sky: ["#04060c", "#151c2d"], far: "#0f1523", near: "#0a0f19", ground: "#0c1018", window: "#ffcf73", lights: 16, light: "#fff1c9" },
  indoor: { sky: ["#2d231d", "#4b3a2e"], far: "#3a2d24", near: "#271e18", ground: "#3b2d22", window: "#ffd9a0", lights: 5, light: "#ffd59a" },
};

type Backdrop = "city" | "field" | "forest" | "room";

export function backdropFor(ambience: Ambience, subject: PreviewSubject): Backdrop {
  if (ambience === "indoor") return "room";
  if (subject === "golfer" || subject === "player") return "field";
  if (subject === "waterfall") return "forest";
  return "city";
}

const FAR = [
  [0, 70, 40], [36, 52, 34], [66, 84, 28], [92, 60, 44], [132, 96, 30], [158, 66, 38], [192, 80, 26], [214, 58, 46], [256, 90, 32], [284, 64, 40], [320, 76, 44],
] as const;
const NEAR = [
  [-6, 112, 58], [48, 128, 44], [88, 104, 62], [214, 118, 52], [262, 100, 60], [318, 124, 50],
] as const;

/** Light points shared by the bokeh and starburst layers. */
export const LIGHTS: readonly (readonly [number, number])[] = [
  [24, 120], [70, 108], [112, 126], [150, 98], [196, 116], [236, 104], [280, 122], [330, 110],
  [44, 150], [128, 146], [250, 148], [310, 140], [92, 82], [178, 76], [300, 86], [346, 158],
];

export function Backdrop({ ambience, subject }: { ambience: Ambience; subject: PreviewSubject }) {
  const p = PALETTES[ambience];
  const kind = backdropFor(ambience, subject);
  const id = `sky-${ambience}`;
  return (
    <svg viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} preserveAspectRatio="xMidYMid slice" className="size-full">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]} />
          <stop offset="1" stopColor={p.sky[1]} />
        </linearGradient>
      </defs>
      <rect width={VIEW.width} height={VIEW.height} fill={`url(#${id})`} />
      {kind === "city" && (
        <>
          {FAR.map(([x, h, w], i) => (
            <rect key={`f${i}`} x={x} y={175 - h} width={w} height={h} fill={p.far} />
          ))}
          {NEAR.map(([x, h, w], i) => (
            <g key={`n${i}`}>
              <rect x={x} y={185 - h} width={w} height={h} fill={p.near} />
              {Array.from({ length: 6 }, (_, r) =>
                Array.from({ length: 3 }, (_, c) => (
                  <rect key={`${r}-${c}`} x={x + 8 + c * (w / 3.4)} y={185 - h + 10 + r * 16} width={6} height={8} fill={p.window} opacity={(r + c + i) % 3 === 0 ? 0.85 : 0.25} />
                )),
              )}
            </g>
          ))}
          <rect y="182" width={VIEW.width} height="58" fill={p.ground} />
        </>
      )}
      {kind === "field" && (
        <>
          {Array.from({ length: 14 }, (_, i) => (
            <ellipse key={i} cx={i * 28 + 6} cy={150 - (i % 3) * 6} rx="22" ry="30" fill={p.near} />
          ))}
          <rect y="160" width={VIEW.width} height="80" fill={p.ground} />
          <rect y="160" width={VIEW.width} height="4" fill="#ffffff" opacity="0.15" />
        </>
      )}
      {kind === "forest" && (
        <>
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={i * 32 - 4} y={20 + (i % 4) * 8} width={10 + (i % 3) * 4} height={200} fill={p.near} />
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <ellipse key={`l${i}`} cx={i * 44} cy={34 + (i % 2) * 18} rx="40" ry="26" fill={p.far} opacity="0.9" />
          ))}
          <rect y="196" width={VIEW.width} height="44" fill={p.ground} />
        </>
      )}
      {kind === "room" && (
        <>
          <rect x="34" y="38" width="96" height="78" rx="3" fill={p.near} />
          <rect x="40" y="44" width="84" height="66" fill={p.sky[1]} opacity="0.35" />
          <rect x="240" y="64" width="96" height="10" fill={p.near} />
          <rect x="246" y="40" width="18" height="24" fill={p.far} />
          <rect x="270" y="46" width="12" height="18" fill={p.far} />
          <rect x="300" y="128" width="6" height="56" fill={p.near} />
          <path d="M 284 128 L 322 128 L 314 106 L 292 106 Z" fill={p.window} opacity="0.9" />
          <rect y="184" width={VIEW.width} height="56" fill={p.ground} />
        </>
      )}
    </svg>
  );
}

/** Subject drawn at the center of the frame, its feet around y = 200. */
export function Subject({ subject, ambience }: { subject: PreviewSubject; ambience: Ambience }) {
  const dark = ambience === "night" || ambience === "blue-hour";
  return (
    <svg viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} preserveAspectRatio="xMidYMid slice" className="size-full">
      {SUBJECTS[subject](dark)}
    </svg>
  );
}

function Person({ x, color, skin, scale = 1, pose = "stand" }: { x: number; color: string; skin: string; scale?: number; pose?: "stand" | "walk" | "run" }) {
  const legs =
    pose === "stand"
      ? "M -8 0 L -6 -42 L 6 -42 L 8 0"
      : pose === "walk"
        ? "M -14 0 L -5 -42 L 6 -42 L 14 0"
        : "M -20 -4 L -5 -42 L 7 -42 L 22 -8";
  return (
    <g transform={`translate(${x} 202) scale(${scale})`}>
      <path d={legs} stroke={color} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M -15 -44 Q -16 -86 0 -88 Q 16 -86 15 -44 Z" fill={color} />
      <circle cx="0" cy="-100" r="12" fill={skin} />
    </g>
  );
}

const SUBJECTS: Record<PreviewSubject, (dark: boolean) => React.ReactNode> = {
  portrait: () => (
    <g>
      <path d="M 120 240 Q 124 168 180 162 Q 236 168 240 240 Z" fill="#b5523b" />
      <rect x="168" y="138" width="24" height="30" fill="#d9a07c" />
      <ellipse cx="180" cy="112" rx="34" ry="40" fill="#e2ac86" />
      <path d="M 144 104 Q 146 64 180 66 Q 216 64 216 104 Q 206 82 180 84 Q 156 82 144 104 Z" fill="#3a2418" />
      <circle cx="167" cy="114" r="3" fill="#2a1a12" />
      <circle cx="193" cy="114" r="3" fill="#2a1a12" />
    </g>
  ),
  child: () => <Person x={180} color="#3c8fd6" skin="#e8b48f" scale={0.85} pose="run" />,
  walker: () => (
    <g>
      <Person x={150} color="#9c4a5e" skin="#d9a07c" pose="walk" />
      <Person x={226} color="#3f5e8a" skin="#c58b67" scale={0.9} pose="walk" />
    </g>
  ),
  player: () => <Person x={180} color="#e04848" skin="#d9a07c" pose="run" />,
  golfer: () => (
    <g>
      <Person x={176} color="#f2f2f2" skin="#d9a07c" />
      <path d="M 186 -100 L 236 -152" transform="translate(0 202)" stroke="#d0d0d0" strokeWidth="3" strokeLinecap="round" />
      <circle cx="238" cy="49" r="5" fill="#9aa0a6" />
    </g>
  ),
  silhouette: () => (
    <g>
      <rect y="196" width={VIEW.width} height="44" fill="#050507" />
      <Person x={180} color="#050507" skin="#050507" />
    </g>
  ),
  statue: () => (
    <g>
      <rect x="146" y="196" width="68" height="44" fill="#d6d2c8" />
      <Person x={180} color="#ece8de" skin="#ece8de" scale={0.95} />
    </g>
  ),
  cyclist: () => (
    <g>
      <circle cx="148" cy="202" r="24" fill="none" stroke="#1c1c1c" strokeWidth="5" />
      <circle cx="218" cy="202" r="24" fill="none" stroke="#1c1c1c" strokeWidth="5" />
      <path d="M 148 202 L 176 168 L 206 168 L 218 202 M 176 168 L 186 202 L 148 202" stroke="#d64535" strokeWidth="5" fill="none" strokeLinejoin="round" />
      <path d="M 178 162 L 190 120 L 214 134" stroke="#f0c330" strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M 186 168 L 194 194" stroke="#264b7a" strokeWidth="9" strokeLinecap="round" />
      <circle cx="196" cy="106" r="11" fill="#e2ac86" />
      <path d="M 184 100 Q 196 88 210 100 Z" fill="#d64535" />
    </g>
  ),
  cars: (dark) => (
    <g>
      {[
        [70, "#3a4a66"],
        [236, "#6a2f2f"],
      ].map(([x, color]) => (
        <g key={x as number} transform={`translate(${x} 0)`}>
          <path d="M 0 210 L 0 190 Q 4 180 20 178 L 34 164 L 82 164 L 98 178 Q 116 180 118 190 L 118 210 Z" fill={color as string} opacity={dark ? 0.55 : 1} />
          <circle cx="24" cy="212" r="10" fill="#111" />
          <circle cx="94" cy="212" r="10" fill="#111" />
          <circle cx="114" cy="192" r="4" fill="#fff6d8" />
          <circle cx="3" cy="194" r="3.5" fill="#ff3b30" />
        </g>
      ))}
    </g>
  ),
  mural: () => (
    <g>
      <rect x="70" y="60" width="220" height="140" fill="#cfc6b6" />
      <circle cx="130" cy="120" r="38" fill="#e2573f" />
      <rect x="170" y="80" width="90" height="60" fill="#2f7fb8" />
      <path d="M 90 190 Q 160 120 270 190 Z" fill="#f2b632" />
      <path d="M 200 150 L 250 110 L 270 170 Z" fill="#3b9b6b" />
    </g>
  ),
  waterfall: () => (
    <g>
      <path d="M 120 40 L 150 40 L 158 200 L 112 200 Z" fill="#e8f2f7" />
      <path d="M 196 60 L 222 60 L 236 210 L 192 210 Z" fill="#dcebf3" />
      {[118, 132, 146, 200, 214, 226].map((x, i) => (
        <rect key={x} x={x} y={50 + (i % 3) * 30} width="3" height="34" fill="#9cc3d6" />
      ))}
      <ellipse cx="96" cy="206" rx="46" ry="22" fill="#4a4e52" />
      <ellipse cx="270" cy="212" rx="56" ry="24" fill="#3e4246" />
      <ellipse cx="176" cy="226" rx="40" ry="16" fill="#55595d" />
    </g>
  ),
  buildings: () => (
    <g>
      <rect x="0" y="196" width={VIEW.width} height="6" fill="#4a4f55" />
      {Array.from({ length: 13 }, (_, i) => (
        <rect key={i} x={i * 30} y="196" width="4" height="44" fill="#4a4f55" />
      ))}
      <rect x="292" y="70" width="6" height="126" fill="#3a3f45" />
      <path d="M 288 70 L 320 70 L 320 76 L 288 76 Z" fill="#3a3f45" />
    </g>
  ),
};
