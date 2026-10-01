"use client";

import { useEffect, useMemo } from "react";
import { DoubleSide, LatheGeometry, Vector2 } from "three";
import { Animated } from "./animated";
import type { Materials } from "./materials";
import { flipX, focalScale, lensBand, ringText } from "./textures";

const AXIS: [number, number, number] = [Math.PI / 2, 0, 0];

function lathe(points: [number, number][], segments = 96) {
  // Lathe revolves around Y; profiles are written as [radius, distance along the lens axis].
  return new LatheGeometry(
    points.map(([r, z]) => new Vector2(r, z)),
    segments,
  );
}

export interface LensState {
  /** 0 retracted, 1 deployed: the front barrel slides out. */
  extension: number;
  zoomTurn: number;
  focusTurn: number;
}

/**
 * Retractable kit zoom, built along +z from the mount face. The rear barrel is
 * fixed, the front barrel slides out when the zoom ring is turned.
 */
export function LensModel({ m, state, name, focals }: { m: Materials; state: LensState; name: string; focals: readonly number[] }) {
  const geometry = useMemo(
    () => ({
      rear: lathe([
        [0.3, 0.035],
        [0.312, 0.05],
        [0.312, 0.14],
        [0.318, 0.15],
        [0.318, 0.36],
        [0.305, 0.37],
      ]),
      front: lathe([
        [0.29, 0.0],
        [0.3, 0.02],
        [0.302, 0.22],
        [0.312, 0.235],
        [0.312, 0.29],
        [0.296, 0.3],
        [0.27, 0.305],
        [0.262, 0.295],
      ]),
    }),
    [],
  );
  const textures = useMemo(
    () => ({ name: flipX(ringText(name)), scale: flipX(focalScale(focals)), band: flipX(lensBand(name, "DX VR")) }),
    [name, focals],
  );
  useEffect(() => () => Object.values(textures).forEach((t) => t.dispose()), [textures]);

  return (
    <group>
      <mesh geometry={geometry.rear} rotation={AXIS} material={m.plastic} />
      {/* Bayonet mount, brushed metal */}
      <mesh rotation={AXIS} position={[0, 0, 0.018]} material={m.metal}>
        <cylinderGeometry args={[0.302, 0.302, 0.036, 96, 1, true]} />
      </mesh>
      {/* Printed band near the mount: gold format marks and lens name */}
      <mesh rotation={AXIS} position={[0, 0, 0.085]}>
        <cylinderGeometry args={[0.3125, 0.3125, 0.04, 128, 1, true, Math.PI * 0.35, Math.PI * 1.3]} />
        <meshStandardMaterial map={textures.band} roughness={0.5} side={DoubleSide} />
      </mesh>
      {/* Index mark and focal scale */}
      <mesh position={[0, 0.319, 0.1]} material={m.chrome}>
        <boxGeometry args={[0.012, 0.004, 0.03]} />
      </mesh>
      <mesh rotation={AXIS} position={[0, 0, 0.145]}>
        <cylinderGeometry args={[0.3185, 0.3185, 0.05, 96, 1, true, Math.PI * 0.75, Math.PI * 0.5]} />
        <meshStandardMaterial map={textures.scale} roughness={0.5} side={DoubleSide} />
      </mesh>
      {/* Zoom ring */}
      <Animated pose={{ rotation: [0, 0, state.zoomTurn] }} lambda={5}>
        <mesh rotation={AXIS} position={[0, 0, 0.27]} material={m.rubberRibs}>
          <cylinderGeometry args={[0.336, 0.336, 0.17, 96, 1, true]} />
        </mesh>
      </Animated>
      {/* Front barrel, slides out when the lens is deployed */}
      <Animated pose={{ position: [0, 0, 0.32 + state.extension * 0.13] }} lambda={5}>
        <mesh geometry={geometry.front} rotation={AXIS} material={m.plastic} />
        {/* Inner tube, visible once the lens is deployed */}
        <mesh rotation={AXIS} position={[0, 0, -0.08]} material={m.plastic}>
          <cylinderGeometry args={[0.292, 0.292, 0.16, 96, 1, true]} />
        </mesh>
        <Animated pose={{ rotation: [0, 0, state.focusTurn] }} lambda={5}>
          <mesh rotation={AXIS} position={[0, 0, 0.26]} material={m.fineRibs}>
            <cylinderGeometry args={[0.314, 0.314, 0.05, 96, 1, true]} />
          </mesh>
        </Animated>
        {/* Thin silver ring at the front, as on the kit lens */}
        <mesh position={[0, 0, 0.297]} material={m.metal}>
          <torusGeometry args={[0.305, 0.0025, 8, 128]} />
        </mesh>
        {/* Name ring around the front element */}
        <mesh position={[0, 0, 0.296]}>
          <ringGeometry args={[0.2, 0.264, 96]} />
          <meshStandardMaterial map={textures.name} roughness={0.6} />
        </mesh>
        {/* Front element: a coated glass dome with iridescent reflections */}
        <mesh position={[0, 0, 0.29 - 0.45]} rotation={[Math.PI / 2, 0, 0]} material={m.coatedGlass}>
          <sphereGeometry args={[0.45, 96, 24, 0, Math.PI * 2, 0, Math.asin(0.2 / 0.45)]} />
        </mesh>
        <mesh position={[0, 0, 0.244]} material={m.glassDark}>
          <circleGeometry args={[0.2, 64]} />
        </mesh>
      </Animated>
    </group>
  );
}
