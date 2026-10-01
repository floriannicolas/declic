"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { MathUtils, type Group } from "three";

type Vec3 = [number, number, number];

export interface Pose {
  position?: Vec3;
  rotation?: Vec3;
}

/**
 * Group that eases towards a target pose every frame (critically damped, no
 * overshoot). The target may depend on the elapsed time for looping moves.
 */
export function Animated({
  pose,
  from,
  lambda = 7,
  children,
}: {
  pose: Pose | ((t: number) => Pose);
  /** Starting pose, for intro animations. */
  from?: Pose;
  lambda?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<Group>(null);
  const started = useRef(false);

  useFrame(({ clock }, delta) => {
    const g = ref.current;
    if (!g) return;
    if (!started.current) {
      started.current = true;
      if (from?.position) g.position.set(...from.position);
      if (from?.rotation) g.rotation.set(...from.rotation);
    }
    const target = typeof pose === "function" ? pose(clock.elapsedTime) : pose;
    const [px, py, pz] = target.position ?? [0, 0, 0];
    const [rx, ry, rz] = target.rotation ?? [0, 0, 0];
    const d = Math.min(delta, 0.05);
    g.position.set(MathUtils.damp(g.position.x, px, lambda, d), MathUtils.damp(g.position.y, py, lambda, d), MathUtils.damp(g.position.z, pz, lambda, d));
    g.rotation.set(MathUtils.damp(g.rotation.x, rx, lambda, d), MathUtils.damp(g.rotation.y, ry, lambda, d), MathUtils.damp(g.rotation.z, rz, lambda, d));
  });

  return <group ref={ref}>{children}</group>;
}
