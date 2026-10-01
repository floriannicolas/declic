"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { micro } from "../motion-tokens";

type Variant = "soft" | "polygonal" | "nervous";

const VARIANTS: { id: Variant; label: string; caption: string }[] = [
  {
    id: "soft",
    label: "Doux",
    caption:
      "Pleine ouverture, lamelles arrondies : des disques ronds aux bords fondus. Dans les coins, le vignetage les écrase en « œil de chat ».",
  },
  {
    id: "polygonal",
    label: "Polygonal",
    caption:
      "Diaphragme fermé de quelques crans : la forme des lamelles apparaît. Avec 7 lamelles droites, chaque point devient un heptagone.",
  },
  {
    id: "nervous",
    label: "Nerveux",
    caption:
      "Formule optique moins corrigée : disques cerclés d'un liseré brillant, branches dédoublées. Le fond paraît agité, alors que la quantité de flou est la même.",
  },
];

const CENTER = { x: 180, y: 105 };

/** [x, y, radius, color] of the out of focus light points. */
const LIGHTS: readonly [number, number, number, string][] = [
  [28, 40, 15, "#ffcf7a"], [74, 150, 18, "#ffd9a0"], [196, 34, 14, "#9fd0ff"], [232, 92, 20, "#ffcf7a"],
  [262, 160, 16, "#ff9f7a"], [300, 54, 18, "#ffe3b0"], [336, 128, 15, "#ffcf7a"], [214, 178, 13, "#9fd0ff"],
  [156, 52, 12, "#ffe3b0"], [24, 182, 14, "#ff9f7a"], [338, 190, 13, "#ffd9a0"], [282, 12, 12, "#9fd0ff"],
];

const BRANCHES = ["M 150 0 Q 210 60 360 70", "M 230 210 Q 260 140 360 110", "M 0 95 Q 40 80 70 40"];

const isEdge = (x: number) => x < 60 || x > 300;

function heptagon(x: number, y: number, r: number): string {
  return Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
    return `${i === 0 ? "M" : "L"} ${(x + r * Math.cos(a)).toFixed(1)} ${(y + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ") + " Z";
}

function Disc({ variant, x, y, r, color }: { variant: Variant; x: number; y: number; r: number; color: string }) {
  if (variant === "polygonal") return <path d={heptagon(x, y, r)} fill={color} fillOpacity={0.5} />;
  if (variant === "nervous")
    return (
      <g>
        <circle cx={x} cy={y} r={r} fill={color} fillOpacity={0.16} stroke={color} strokeOpacity={0.95} strokeWidth={2.4} />
        <circle cx={x} cy={y} r={r * 0.55} fill="none" stroke={color} strokeOpacity={0.3} strokeWidth={1} />
      </g>
    );
  if (isEdge(x)) {
    const angle = (Math.atan2(y - CENTER.y, x - CENTER.x) * 180) / Math.PI;
    return <ellipse cx={x} cy={y} rx={r * 0.62} ry={r} transform={`rotate(${angle} ${x} ${y})`} fill={color} fillOpacity={0.55} filter="url(#bokeh-soft)" />;
  }
  return <circle cx={x} cy={y} r={r} fill={color} fillOpacity={0.55} filter="url(#bokeh-soft)" />;
}

export function BokehIllustration() {
  const [variant, setVariant] = useState<Variant>("soft");
  const current = VARIANTS.find((v) => v.id === variant)!;

  return (
    <figure className="flex flex-col gap-3">
      <div role="group" aria-label="Type de bokeh" className="grid grid-cols-3 gap-1 rounded-full border border-line bg-surface-2 p-1">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={variant === v.id}
            onClick={() => setVariant(v.id)}
            className="relative min-h-11 rounded-full text-fluid-sm font-medium"
          >
            {variant === v.id && (
              <motion.span layoutId="bokeh-variant" transition={micro} className="absolute inset-0 rounded-full bg-accent" />
            )}
            <span className={`relative ${variant === v.id ? "text-accent-ink" : "text-muted"}`}>{v.label}</span>
          </button>
        ))}
      </div>

      <svg viewBox="0 0 360 210" className="w-full overflow-hidden rounded-xl border border-line" role="img" aria-label={`Bokeh ${current.label.toLowerCase()} : ${current.caption}`}>
        <defs>
          <linearGradient id="bokeh-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0b1020" />
            <stop offset="1" stopColor="#1b2338" />
          </linearGradient>
          <filter id="bokeh-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
          <filter id="bokeh-branch" x="-10%" y="-50%" width="120%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        <rect width="360" height="210" fill="url(#bokeh-bg)" />

        <AnimatePresence initial={false}>
          <motion.g
            key={variant}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {BRANCHES.map((d) =>
              variant === "nervous" ? (
                <g key={d} fill="none" stroke="#6b7a96" strokeOpacity={0.45} strokeWidth={1.5}>
                  <path d={d} />
                  <path d={d} transform="translate(0 7)" />
                </g>
              ) : (
                <path key={d} d={d} fill="none" stroke="#6b7a96" strokeOpacity={0.3} strokeWidth={7} filter="url(#bokeh-branch)" />
              ),
            )}
            {LIGHTS.map(([x, y, r, color]) => (
              <Disc key={`${x}-${y}`} variant={variant} x={x} y={y} r={r} color={color} />
            ))}
          </motion.g>
        </AnimatePresence>

        <g>
          <path d="M 62 210 Q 66 150 112 142 Q 158 150 162 210 Z" fill="#07080b" />
          <rect x="102" y="118" width="20" height="28" fill="#07080b" />
          <ellipse cx="112" cy="98" rx="24" ry="29" fill="#07080b" />
          <path d="M 134 86 Q 140 104 132 122" stroke="#f3c98b" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M 152 160 Q 160 180 162 210" stroke="#f3c98b" strokeOpacity="0.6" strokeWidth="1.4" fill="none" />
        </g>
      </svg>

      <AnimatePresence mode="wait" initial={false}>
        <motion.figcaption
          key={variant}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={micro}
          className="text-fluid-sm leading-relaxed"
        >
          {current.caption}
        </motion.figcaption>
      </AnimatePresence>
      <p className="text-fluid-xs text-muted">
        Dans les trois cas, le sujet est net et la quantité de flou est identique : seule la qualité du flou change. C&apos;est ça, le bokeh.
      </p>
    </figure>
  );
}
