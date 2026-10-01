"use client";

import { useId } from "react";

const LIGHTS: readonly [number, number][] = [
  [20, 52], [52, 70], [86, 46], [118, 64], [212, 50], [248, 72], [280, 44], [318, 66], [344, 54], [168, 40],
];
const BUILDINGS: readonly [number, number, number][] = [
  [0, 60, 44], [40, 44, 38], [76, 70, 30], [104, 50, 46], [196, 64, 40], [232, 40, 34], [264, 76, 46], [306, 52, 54],
];

export interface MiniSceneProps {
  /** Background defocus blur, in viewBox units. */
  blur?: number;
  /** Horizontal motion blur of the subject, in viewBox units. Static illustrations can afford a real SVG blur. */
  subjectSmear?: number;
  /** Horizontal streak of the background (panning). */
  backgroundSmear?: number;
  /** 0 to 1. */
  grain?: number;
  /** Stops relative to a correct exposure: positive is brighter. */
  light?: number;
  subject?: "person" | "cyclist";
}

/** Small evening street scene (360 x 170) reused by the vocabulary illustrations. */
export function MiniScene({ blur = 0, subjectSmear = 0, backgroundSmear = 0, grain = 0, light = 0, subject = "person" }: MiniSceneProps) {
  const uid = useId().replace(/:/g, "");
  const background = (
    <g>
      {BUILDINGS.map(([x, h, w]) => (
        <rect key={x} x={x} y={130 - h} width={w} height={h + 40} fill="#2a3150" />
      ))}
      {LIGHTS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={3 + blur * 0.9} fill="#ffd27a" fillOpacity={Math.max(0.35, 1 - blur * 0.07)} />
      ))}
      <rect y="130" width="360" height="40" fill="#1d2233" />
    </g>
  );
  const person = (
    <g>
      <path d="M 150 170 Q 152 118 180 114 Q 208 118 210 170 Z" fill="#c2533d" />
      <circle cx="180" cy="92" r="20" fill="#e2ac86" />
      <path d="M 160 88 Q 162 66 180 68 Q 200 66 200 88 Q 192 76 180 78 Q 168 76 160 88 Z" fill="#3a2418" />
    </g>
  );
  const cyclist = (
    <g>
      <circle cx="150" cy="150" r="17" fill="none" stroke="#e8e8e8" strokeWidth="4" />
      <circle cx="206" cy="150" r="17" fill="none" stroke="#e8e8e8" strokeWidth="4" />
      <path d="M 150 150 L 172 122 L 196 122 L 206 150 M 172 122 L 180 150 L 150 150" stroke="#d64535" strokeWidth="4" fill="none" />
      <path d="M 174 118 L 184 86 L 202 98" stroke="#f0c330" strokeWidth="10" strokeLinecap="round" fill="none" />
      <circle cx="190" cy="74" r="9" fill="#e2ac86" />
    </g>
  );
  const subjectShape = subject === "cyclist" ? cyclist : person;

  return (
    <g>
      <defs>
        <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a2550" />
          <stop offset="1" stopColor="#5b4a7a" />
        </linearGradient>
        <filter id={`blur-${uid}`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={`${blur + backgroundSmear / 2.5} ${blur}`} />
        </filter>
        <filter id={`smear-${uid}`} x="-40%" y="-10%" width="180%" height="120%">
          <feGaussianBlur stdDeviation={`${subjectSmear / 2.5} 0`} />
        </filter>
        <filter id={`grain-${uid}`}>
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="3" />
          <feColorMatrix values="0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 0 1" />
        </filter>
        <clipPath id={`clip-${uid}`}>
          <rect width="360" height="170" />
        </clipPath>
      </defs>
      <g clipPath={`url(#clip-${uid})`}>
        <rect width="360" height="170" fill={`url(#sky-${uid})`} />
        <g filter={blur + backgroundSmear > 0.05 ? `url(#blur-${uid})` : undefined}>{background}</g>
        <g filter={subjectSmear > 0.5 ? `url(#smear-${uid})` : undefined}>{subjectShape}</g>
        <rect width="360" height="170" fill="#000" opacity={Math.min(0.88, Math.max(0, -light / 3))} />
        <rect width="360" height="170" fill="#fff" opacity={Math.min(0.85, Math.max(0, light / 2.6))} />
        {grain > 0.02 && (
          <rect width="360" height="170" filter={`url(#grain-${uid})`} opacity={grain * 0.55} style={{ mixBlendMode: "overlay" }} />
        )}
      </g>
    </g>
  );
}
