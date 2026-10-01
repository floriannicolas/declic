"use client";

import { useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import { Box3, Euler, Matrix3, Mesh, MeshStandardMaterial, Quaternion, Vector3, type Object3D } from "three";
import type { CameraModel3d, ModelSpot } from "@/types";

/** Width of the normalised model, in viewer units: same scale as the generic body. */
const TARGET_WIDTH = 1.24;
const FLOOR = -0.5;

/**
 * Loads a meshopt compressed .glb (decoder bundled, no network), orients it,
 * then scales and centres it so spots and camera distances are model agnostic.
 */
export function ScannedModel({ model, pick }: { model: CameraModel3d; pick?: boolean }) {
  // Draco off (its decoder would come from a CDN), meshopt on.
  const { scene } = useGLTF(model.src, false, true);

  const object = useMemo(() => {
    const root = scene.clone(true);
    if (model.rotation) root.setRotationFromEuler(new Euler(...model.rotation));
    root.updateMatrixWorld(true);
    const box = new Box3().setFromObject(root);
    const size = box.getSize(new Vector3());
    const scale = TARGET_WIDTH / size.x;
    const center = box.getCenter(new Vector3());
    root.scale.setScalar(scale);
    root.position.set(-center.x * scale, FLOOR - box.min.y * scale, -center.z * scale);
    root.traverse((o: Object3D) => {
      if (o instanceof Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.material instanceof MeshStandardMaterial) o.material.envMapIntensity = 1.15;
      }
    });
    return root;
  }, [scene, model.rotation]);

  const logSpot = (e: ThreeEvent<MouseEvent>) => {
    if (!pick || !e.face) return;
    e.stopPropagation();
    const normal = e.face.normal.clone().applyMatrix3(new Matrix3().getNormalMatrix(e.object.matrixWorld)).normalize();
    const round = (v: Vector3) => [v.x, v.y, v.z].map((n) => Math.round(n * 1000) / 1000);
    console.info("[spot]", JSON.stringify({ position: round(e.point), normal: round(normal) }));
  };

  return <primitive object={object} onClick={pick ? logSpot : undefined} />;
}

/** Glowing ring laid flat on the surface around the selected control. */
export function SpotHalo({ spot }: { spot: ModelSpot }) {
  const quaternion = useMemo(
    () => new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), new Vector3(...spot.normal).normalize()),
    [spot.normal],
  );
  const position = new Vector3(...spot.position).addScaledVector(new Vector3(...spot.normal).normalize(), 0.006);
  return (
    <mesh position={position} quaternion={quaternion}>
      <torusGeometry args={[0.06, 0.006, 12, 48]} />
      <meshBasicMaterial color="#ffb020" toneMapped={false} />
    </mesh>
  );
}
