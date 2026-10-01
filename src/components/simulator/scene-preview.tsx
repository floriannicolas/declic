"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { previewEffects, smearDirection, type PreviewEffects } from "@/engine/preview";
import { interpolate, type SimulatorSetup } from "@/engine/simulator";
import type { PreviewPhoto } from "@/types";
import { Backdrop, LIGHTS, PALETTES, Subject, VIEW } from "./scene-art";

const GHOSTS = [1, 2, 3, 4];

type Direction = readonly [number, number];
const HORIZONTAL: Direction = [1, 0];

const NOISE = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 0 1'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>",
)}")`;

const NIGHT_LIKE = new Set(["night", "blue-hour", "dusk", "indoor"]);

/**
 * Live preview driven by the dials' continuous positions: it updates on every
 * frame while a dial turns, without re-rendering React. Only transform,
 * opacity and filter are animated.
 */
export function ScenePreview({
  setup,
  positions,
}: {
  setup: SimulatorSetup;
  positions: { shutter: MotionValue<number>; aperture: MotionValue<number>; iso: MotionValue<number> };
}) {
  const { scenario, scales } = setup;
  const { ambience, subject, photo } = scenario.preview;
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / VIEW.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const effects = useTransform<number, PreviewEffects>([positions.shutter, positions.aperture, positions.iso], ([s, a, i]) =>
    previewEffects(setup, {
      seconds: interpolate(scales.shutter.values, s),
      fNumber: interpolate(scales.aperture.values, a),
      iso: interpolate(scales.iso.values, i),
    }),
  );

  const px = (pick: (e: PreviewEffects) => number) => (e: PreviewEffects) => pick(e) * scale;
  const backgroundFilter = useTransform(effects, (e) => `blur(${(e.backgroundBlur * scale).toFixed(2)}px)`);
  const shakeFilter = useTransform(effects, (e) => (e.shake > 0.05 ? `blur(${(e.shake * scale * 0.6).toFixed(2)}px)` : "none"));
  const backgroundSmear = useTransform(effects, px((e) => e.backgroundSmear));
  const subjectSmear = useTransform(effects, px((e) => e.subjectSmear));
  const bokeh = useTransform(effects, (e) => e.bokehScale);
  const bokehOpacity = useTransform(effects, (e) => 1 / Math.pow(e.bokehScale, 0.7));
  const starburst = useTransform(effects, (e) => (NIGHT_LIKE.has(ambience) ? e.starburst * (1 - Math.min(1, e.backgroundBlur / 3)) : 0));
  const darken = useTransform(effects, (e) => Math.min(Math.max(e.exposureOffset / 3.2, 0), 0.9));
  const brighten = useTransform(effects, (e) => Math.min(Math.max(-e.exposureOffset / 2.6, 0), 0.88));
  const grain = useTransform(effects, (e) => e.grain * 0.7);

  const palette = PALETTES[ambience];
  const lights = photo ? [] : LIGHTS.slice(0, palette.lights);
  const direction = smearDirection(scenario);

  return (
    <div
      ref={frame}
      className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl border border-line bg-black"
      role="img"
      aria-label={`${photo ? "Aperçu" : "Aperçu schématique"} : ${scenario.title}`}
    >
      <motion.div className="absolute inset-0" style={{ filter: shakeFilter }}>
        <motion.div className="absolute -inset-[4%] will-change-[filter]" style={{ filter: backgroundFilter }}>
          <Smeared smear={backgroundSmear} direction={HORIZONTAL}>
            {photo ? <PhotoLayer src={photo.background} priority /> : <Backdrop ambience={ambience} subject={subject} />}
          </Smeared>
          {lights.length > 0 && (
            <svg viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
              {lights.map(([x, y]) => (
                <motion.circle
                  key={`${x}-${y}`}
                  cx={x}
                  cy={y}
                  r={2.4}
                  fill={palette.light}
                  style={{ scale: bokeh, opacity: bokehOpacity, transformBox: "fill-box", transformOrigin: "center" }}
                />
              ))}
            </svg>
          )}
        </motion.div>

        {lights.length > 0 && (
          <motion.svg
            viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
            preserveAspectRatio="xMidYMid slice"
            className="absolute -inset-[4%] size-[108%]"
            style={{ opacity: starburst }}
          >
            {lights.map(([x, y]) => (
              <g key={`${x}-${y}`} stroke={palette.light} strokeWidth="0.7" strokeLinecap="round" opacity="0.9">
                <line x1={x - 9} y1={y} x2={x + 9} y2={y} />
                <line x1={x} y1={y - 9} x2={x} y2={y + 9} />
                <line x1={x - 5} y1={y - 5} x2={x + 5} y2={y + 5} />
                <line x1={x - 5} y1={y + 5} x2={x + 5} y2={y - 5} />
              </g>
            ))}
          </motion.svg>
        )}

        {(!photo || photo.subject) && (
          <Smeared smear={subjectSmear} direction={direction}>
            {photo?.subject ? <PhotoSubject subject={photo.subject} /> : <Subject subject={subject} ambience={ambience} />}
          </Smeared>
        )}
      </motion.div>

      <motion.div aria-hidden className="absolute inset-0 bg-black" style={{ opacity: darken }} />
      <motion.div aria-hidden className="absolute inset-0 bg-white" style={{ opacity: brighten }} />
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-overlay" style={{ opacity: grain }}>
        <div className="grain absolute -inset-[10%]" style={{ backgroundImage: NOISE, backgroundSize: `${180 * Math.max(0.6, scale * 0.5)}px` }} />
      </motion.div>
    </div>
  );
}

function PhotoLayer({ src, priority }: { src: string; priority?: boolean }) {
  return <Image src={src} alt="" fill priority={priority} draggable={false} sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover select-none" />;
}

function PhotoSubject({ subject }: { subject: NonNullable<PreviewPhoto["subject"]> }) {
  const style: React.CSSProperties = {
    filter: subject.silhouette ? "brightness(0)" : undefined,
    transform: subject.flip ? "scaleX(-1)" : undefined,
  };
  if (subject.placement.kind === "fill") {
    return (
      <div className="absolute inset-0" style={style}>
        <PhotoLayer src={subject.src} />
      </div>
    );
  }
  const { centerX, bottom, height } = subject.placement;
  return (
    <div className="absolute" style={{ left: `${centerX * 100}%`, top: `${(bottom - height) * 100}%`, height: `${height * 100}%`, translate: "-50% 0" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- intrinsic width from a fixed height, which next/image cannot express */}
      <img src={subject.src} alt="" draggable={false} className="h-full w-auto max-w-none select-none" style={style} />
    </div>
  );
}

/** Motion blur from composited copies: each ghost is translated and faded, nothing is repainted. */
function Smeared({ smear, direction, children }: { smear: MotionValue<number>; direction: Direction; children: React.ReactNode }) {
  const style = useOffset(smear, direction, 0);
  return (
    <div className="absolute inset-0">
      <motion.div className="absolute inset-0" style={style}>
        {children}
      </motion.div>
      {GHOSTS.map((k) => (
        <Ghost key={k} smear={smear} direction={direction} k={k}>
          {children}
        </Ghost>
      ))}
    </div>
  );
}

function Ghost({ smear, direction, k, children }: { smear: MotionValue<number>; direction: Direction; k: number; children: React.ReactNode }) {
  const opacity = useTransform(smear, (s) => (s < 0.5 ? 0 : 0.42 * (1 - k / (GHOSTS.length + 1))));
  const style = useOffset(smear, direction, k);
  return (
    <motion.div aria-hidden className="absolute inset-0" style={{ ...style, opacity }}>
      {children}
    </motion.div>
  );
}

function useOffset(smear: MotionValue<number>, [dx, dy]: Direction, k: number) {
  const x = useTransform(smear, (s) => s * (k / GHOSTS.length - 0.5) * dx);
  const y = useTransform(smear, (s) => s * (k / GHOSTS.length - 0.5) * dy);
  return { x, y };
}
