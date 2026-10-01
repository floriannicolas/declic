"use client";

import { CameraControls, ContactShadows, Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, N8AO, Vignette } from "@react-three/postprocessing";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Vector3 } from "three";
import type { BodyAnchor, CameraModel3d, CameraPart, ModelSpot } from "@/types";
import { ANCHORS, BodyModel } from "./body-model";
import { ScannedModel, SpotHalo } from "./scanned-model";

type Spots = Readonly<Partial<Record<BodyAnchor, ModelSpot>>>;

const HOME = { position: [-2.3, 1.15, 2.6] as const, target: [0, 0.02, 0.15] as const };
const INTRO_FROM = [-5.5, 3.2, 6.5] as const;
const FOCUS_DISTANCE = 1.9;
const IDLE_SPIN = 0.18;
const IDLE_DELAY = 2.5;

interface Props {
  parts: readonly CameraPart[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  exploded: boolean;
  model?: CameraModel3d;
  /** Development aid: clicking the model logs the spot under the pointer. */
  pick?: boolean;
}

/** Interactive 3D body. Loaded on demand: three.js stays out of the rest of the game. */
export default function CameraViewer({ parts: allParts, selectedId, onSelect, exploded, model, pick }: Props) {
  const spots: Spots = model ? model.spots : ANCHORS;
  // Controls absent from this body (or not placed on the model) are simply not shown.
  // A scanned model only shows the controls that were placed on it.
  const parts = allParts.filter((p) => spots[p.anchor]);
  const selected = parts.find((p) => p.id === selectedId) ?? null;
  // A stable registry shared by the DOM markers and the projector in the canvas.
  const [markers] = useState(() => new Map<string, HTMLButtonElement>());
  const [quality, setQuality] = useState<"high" | "low">("high");

  return (
    <div className="relative size-full bg-[radial-gradient(ellipse_at_50%_35%,#2a2d36_0%,#121318_55%,#0b0c0f_100%)]">
      <Canvas
        camera={{ position: [...INTRO_FROM], fov: 32, near: 0.05, far: 40 }}
        dpr={quality === "high" ? [1, 2] : 1}
        gl={{ alpha: true, antialias: true }}
        onPointerMissed={() => onSelect(null)}
        className="touch-none"
      >
        <PerformanceMonitor onDecline={() => setQuality("low")} />
        <Studio />
        {model ? (
          <>
            <ScannedModel model={model} pick={pick} />
            {selected && spots[selected.anchor] && <SpotHalo spot={spots[selected.anchor]!} />}
          </>
        ) : (
          <BodyModel selected={selected?.anchor ?? null} exploded={exploded} />
        )}
        <ContactShadows position={[0, -0.5, 0]} opacity={0.65} scale={5} blur={2.6} far={1.2} resolution={512} color="#000000" />
        <MarkerProjector parts={parts} spots={spots} selectedId={selectedId} markers={markers} />
        <Rig target={selected && spots[selected.anchor] ? spots[selected.anchor]! : null} exploded={exploded} />
        {quality === "high" && (
          <EffectComposer multisampling={4}>
            <N8AO aoRadius={0.12} intensity={2.2} distanceFalloff={0.5} halfRes />
            <Bloom mipmapBlur luminanceThreshold={1} intensity={0.7} radius={0.6} />
            <Vignette offset={0.25} darkness={0.55} />
          </EffectComposer>
        )}
      </Canvas>
      <div className={`transition-opacity duration-300 ${exploded ? "pointer-events-none opacity-0" : ""}`}>
        <Markers parts={parts} selectedId={selectedId} onSelect={onSelect} markers={markers} />
      </div>
    </div>
  );
}

/**
 * Photo studio lighting rendered into an environment map: large softboxes
 * give the glossy parts long, clean reflections. Nothing is downloaded.
 */
function Studio() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[-3, 5, 4]} intensity={2.4} />
      <directionalLight position={[4, 2, -3]} intensity={1.4} color="#bcd0ff" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 2]} rotation-x={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={2.2} position={[-4, 1, 1]} rotation-y={Math.PI / 2} scale={[3, 5, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[4, 1, -1]} rotation-y={-Math.PI / 2} scale={[2, 5, 1]} color="#cfe0ff" />
        <Lightformer form="ring" intensity={2.5} position={[0, 1, 5]} scale={1.6} color="#ffe9c9" />
        <Lightformer form="rect" intensity={0.6} position={[0, -3, 0]} rotation-x={-Math.PI / 2} scale={[8, 8, 1]} color="#30343c" />
      </Environment>
    </>
  );
}

/**
 * Camera direction: a swooping intro, a slow turntable while idle, and a smooth
 * flight towards each selected control.
 */
function Rig({ target, exploded }: { target: ModelSpot | null; exploded: boolean }) {
  const controls = useRef<CameraControls>(null);
  const reduced = useReducedMotion();
  const lastInput = useRef(0);
  const { clock } = useThree();

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const onStart = () => (lastInput.current = Infinity);
    const onEnd = () => (lastInput.current = clock.elapsedTime);
    c.addEventListener("controlstart", onStart);
    c.addEventListener("controlend", onEnd);
    return () => {
      c.removeEventListener("controlstart", onStart);
      c.removeEventListener("controlend", onEnd);
    };
  }, [clock]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    lastInput.current = clock.elapsedTime;
    if (!target) {
      const zoomOut = exploded ? 1.35 : 1;
      c.setLookAt(HOME.position[0] * zoomOut, HOME.position[1] * zoomOut, HOME.position[2] * zoomOut, ...HOME.target, !reduced);
      return;
    }
    const { position, normal } = target;
    const n = new Vector3(...normal).normalize();
    // Look from the side the control faces, slightly raised for context.
    const eye = new Vector3(...position).addScaledVector(n, FOCUS_DISTANCE).add(new Vector3(-0.35, 0.35, 0).multiplyScalar(n.y === 0 ? 1 : 0.4));
    c.setLookAt(eye.x, eye.y, eye.z, position[0], position[1], position[2], !reduced);
  }, [target, exploded, reduced, clock]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c || reduced || target) return;
    if (clock.elapsedTime - lastInput.current > IDLE_DELAY) c.azimuthAngle += delta * IDLE_SPIN;
  });

  return <CameraControls ref={controls} minDistance={0.9} maxDistance={7} smoothTime={0.5} />;
}

/**
 * Positions the HTML markers over the canvas every frame, and hides those
 * whose control faces away. Writing styles directly keeps React out of the loop.
 */
function MarkerProjector({
  parts,
  spots,
  selectedId,
  markers,
}: {
  parts: readonly CameraPart[];
  spots: Spots;
  selectedId: string | null;
  markers: Map<string, HTMLButtonElement>;
}) {
  const { camera, size } = useThree();
  const point = useRef(new Vector3());
  const toCamera = useRef(new Vector3());
  const normal = useRef(new Vector3());

  useFrame(() => {
    for (const part of parts) {
      const el = markers.get(part.id);
      if (!el) continue;
      const spot = spots[part.anchor];
      if (!spot) continue;
      point.current.set(...spot.position);
      toCamera.current.copy(camera.position).sub(point.current).normalize();
      const facing = toCamera.current.dot(normal.current.set(...spot.normal).normalize());
      point.current.project(camera);
      const x = ((point.current.x + 1) / 2) * size.width;
      const y = ((1 - point.current.y) / 2) * size.height;
      // While a control is in focus, only its marker stays, so the engravings around it remain readable.
      const visible = (selectedId ? part.id === selectedId : facing > 0.05) && point.current.z < 1;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
      el.style.opacity = visible ? "1" : "0";
      el.style.pointerEvents = visible ? "auto" : "none";
    }
  });
  return null;
}

function Markers({
  parts,
  selectedId,
  onSelect,
  markers,
}: Pick<Props, "parts" | "selectedId" | "onSelect"> & { markers: Map<string, HTMLButtonElement> }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {parts.map((part, i) => {
        const selected = part.id === selectedId;
        return (
          <button
            key={part.id}
            ref={(el) => {
              if (el) markers.set(part.id, el);
              else markers.delete(part.id);
            }}
            type="button"
            onClick={() => onSelect(selected ? null : part.id)}
            aria-label={part.name}
            aria-pressed={selected}
            style={{ opacity: 0 }}
            className="group absolute top-0 left-0 grid size-11 place-items-center transition-opacity duration-200"
          >
            {selected && <span aria-hidden className="absolute size-9 animate-ping rounded-full bg-accent/40" />}
            <span
              className={`tabular relative grid place-items-center rounded-full border text-[0.65rem] font-bold shadow-[0_2px_10px_rgb(0_0_0/0.6)] backdrop-blur-sm transition-[width,height,background-color] duration-200 ${
                selected ? "size-7 border-accent bg-accent text-accent-ink" : "size-6 border-white/40 bg-black/55 text-white group-hover:border-accent"
              }`}
            >
              {i + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}
