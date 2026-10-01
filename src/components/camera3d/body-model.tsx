"use client";

import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  ExtrudeGeometry,
  LatheGeometry,
  Quaternion,
  Shape,
  TubeGeometry,
  Vector2,
  Vector3,
  type Texture,
} from "three";
import type { BodyAnchor } from "@/types";
import { Animated, type Pose } from "./animated";
import { bodyDistance, buildBodyMeshes, flashDistance, hitBody, type BodyMeshes, type MeshData, type V3 } from "./body-sdf";
import { LensModel, type LensState } from "./lens-model";
import { useMaterials, type Materials } from "./materials";
import { engraving, flipX, infoScreen, radialLabels } from "./textures";

/**
 * Nikon D3500 modelled after reference photos. The shell is a signed distance
 * field meshed into one smooth, moulded surface (see body-sdf), and every
 * control is placed by ray casting onto that curved surface. Units are
 * decimetres. Layout coordinates are the photographer's: x to the right (grip
 * side), y up, z forward. Three.js is right handed, so looking along +z puts +x
 * on the left: the model is mirrored once, at the root, and ANCHORS are mirrored too.
 */
type Vec3 = V3;

export interface AnchorSpot {
  position: Vec3;
  /** Direction the control faces, used to hide markers on the far side. */
  normal: Vec3;
}

interface Spot {
  position: Vec3;
  normal: Vec3;
}

function cast(origin: Vec3, direction: Vec3, sdf = bodyDistance): Spot {
  const hit = hitBody(origin, direction, sdf);
  if (!hit) throw new Error(`Aucune surface trouvée depuis ${origin.join(", ")}`);
  return hit;
}
const onTop = (x: number, z: number) => cast([x, 1, z], [0, -1, 0]);
const onBack = (x: number, y: number) => cast([x, y, -1], [0, 0, 1]);
const onFront = (x: number, y: number) => cast([x, y, 1], [0, 0, -1]);
const onSide = (side: 1 | -1, y: number, z: number) => cast([side * 1.2, y, z], [-side, 0, 0]);
const lift = (s: Spot, d: number): Vec3 => [s.position[0] + s.normal[0] * d, s.position[1] + s.normal[1] * d, s.position[2] + s.normal[2] * d];

/** Every control, positioned on the shell once at module load (pure math). */
const S = {
  shutter: onTop(0.47, 0.27),
  power: onTop(0.565, 0.27),
  modeDial: onTop(0.23, -0.08),
  plusMinus: onTop(0.4, 0.1),
  record: onTop(0.5, 0.11),
  hotShoe: onTop(-0.08, -0.12),
  screen: onBack(-0.25, -0.12),
  eyepiece: onBack(-0.08, 0.37),
  diopter: onBack(0.1, 0.38),
  commandDialTop: onTop(0.5, -0.24),
  commandDialBack: onBack(0.5, 0.2),
  // Rear, after the reference manual: info and AE-L/AF-L right of the eyepiece,
  // then the column right of the monitor; the flash button left of the eyepiece.
  info: onBack(0.14, 0.27),
  aeLock: onBack(0.31, 0.27),
  playback: onBack(0.15, 0.13),
  menu: onBack(0.15, 0.01),
  i: onBack(0.29, 0.13),
  multi: onBack(0.32, -0.08),
  releaseMode: onBack(0.45, -0.21),
  zoom: onBack(0.15, -0.18),
  help: onBack(0.15, -0.3),
  del: onBack(0.31, -0.31),
  cardLamp: onBack(0.47, -0.08),
  flashButton: onBack(-0.31, 0.24),
  lensRelease: onFront(-0.44, -0.12),
  microphone: onFront(-0.46, 0.12),
  speaker: onSide(-1, 0.25, -0.16),
  afLamp: onFront(0.24, 0.17),
  modelName: onFront(-0.45, 0.21),
  cardDoor: onSide(1, -0.05, 0.08),
  ports: onSide(-1, -0.05, -0.05),
  lugLeft: onSide(-1, 0.2, -0.04),
  lugRight: onSide(1, 0.2, -0.04),
  battery: cast([0.47, -1, 0.05], [0, 1, 0]),
};
const FLASH_WINDOW = cast([-0.08, 0.425, 1], [0, 0, -1], flashDistance);
/** Hinge of the pop up flash, at the back of its top, just ahead of the hot shoe. */
const FLASH_HINGE: Vec3 = [-0.08, 0.45, -0.07];
/** Glossy plate on the front of the prism, under the flash. */
const PRISM_PLATE = cast([-0.08, 0.33, 1], [0, 0, -1]);

const MARK = 0.012;
const LAYOUT: Partial<Record<BodyAnchor, AnchorSpot>> = {
  "shutter-button": { position: lift(S.shutter, 0.06), normal: S.shutter.normal },
  "power-switch": { position: lift(S.power, 0.03), normal: S.power.normal },
  "mode-dial": { position: lift(S.modeDial, 0.1), normal: [0, 1, 0] },
  "command-dial": { position: [0.5, S.commandDialTop.position[1] - 0.01, S.commandDialBack.position[2] - 0.06], normal: [0, 0.6, -1] },
  "exposure-compensation-button": { position: lift(S.plusMinus, 0.03), normal: S.plusMinus.normal },
  "movie-record-button": { position: lift(S.record, 0.03), normal: S.record.normal },
  "live-view-switch": { position: [S.modeDial.position[0] + 0.13, S.modeDial.position[1] + 0.02, S.modeDial.position[2] - 0.06], normal: [0.5, 0.6, -0.6] },
  "info-button": { position: lift(S.info, MARK), normal: S.info.normal },
  "release-mode-button": { position: lift(S.releaseMode, MARK), normal: S.releaseMode.normal },
  "help-button": { position: lift(S.help, MARK), normal: S.help.normal },
  "card-access-lamp": { position: lift(S.cardLamp, MARK), normal: S.cardLamp.normal },
  microphone: { position: lift(S.microphone, MARK), normal: S.microphone.normal },
  speaker: { position: lift(S.speaker, MARK), normal: S.speaker.normal },
  "menu-button": { position: lift(S.menu, MARK), normal: S.menu.normal },
  "i-button": { position: lift(S.i, MARK), normal: S.i.normal },
  "playback-button": { position: lift(S.playback, MARK), normal: S.playback.normal },
  "ae-af-lock-button": { position: lift(S.aeLock, MARK), normal: S.aeLock.normal },
  "multi-selector": { position: lift(S.multi, MARK), normal: S.multi.normal },
  "delete-button": { position: lift(S.del, MARK), normal: S.del.normal },
  "zoom-button": { position: lift(S.zoom, MARK), normal: S.zoom.normal },
  "rear-screen": { position: lift(S.screen, MARK), normal: S.screen.normal },
  viewfinder: { position: lift(S.eyepiece, 0.07), normal: S.eyepiece.normal },
  diopter: { position: lift(S.diopter, 0.03), normal: S.diopter.normal },
  "built-in-flash": { position: lift(FLASH_WINDOW, 0.02), normal: FLASH_WINDOW.normal },
  "hot-shoe": { position: lift(S.hotShoe, 0.03), normal: S.hotShoe.normal },
  "flash-button": { position: lift(S.flashButton, MARK), normal: S.flashButton.normal },
  "lens-release": { position: lift(S.lensRelease, MARK), normal: S.lensRelease.normal },
  "zoom-ring": { position: [-0.08, 0.28, 0.47], normal: [0, 1, 0] },
  "focus-ring": { position: [-0.08, 0.26, 0.79], normal: [0, 1, 0] },
  "af-assist-lamp": { position: lift(S.afLamp, MARK), normal: S.afLamp.normal },
  "card-slot": { position: lift(S.cardDoor, MARK), normal: S.cardDoor.normal },
  battery: { position: lift(S.battery, MARK), normal: S.battery.normal },
  ports: { position: lift(S.ports, MARK), normal: S.ports.normal },
};

const mirror = ([x, y, z]: Vec3): Vec3 => [-x, y, z];

/** Anchors in scene coordinates. */
export const ANCHORS = Object.fromEntries(
  Object.entries(LAYOUT).map(([k, spot]) => [k, { position: mirror(spot!.position), normal: mirror(spot!.normal) }]),
) as Partial<Record<BodyAnchor, AnchorSpot>>;

const MOUNT: Vec3 = [-0.08, -0.06, 0.2];
const MODE_LABELS = ["AUTO", "⊘", "P", "S", "A", "M", "EFFECTS", "GUIDE", "☺", "▲", "♣"];

/** Rotation turning local +y onto a surface normal. */
const align = (normal: Vec3) => new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(...normal).normalize());

function toGeometry(mesh: MeshData, shellIndexCount?: number) {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(mesh.positions, 3));
  g.setAttribute("normal", new BufferAttribute(mesh.normals, 3));
  g.setAttribute("uv", new BufferAttribute(mesh.uvs, 2));
  g.setIndex(new BufferAttribute(mesh.indices, 1));
  if (shellIndexCount !== undefined) {
    // Two material groups: shell first, rubber covering second.
    g.addGroup(0, shellIndexCount, 0);
    g.addGroup(shellIndexCount, mesh.indices.length - shellIndexCount, 1);
  }
  return g;
}

/**
 * Meshes the body in a Web Worker: half a second of math that would otherwise
 * freeze the page. Falls back to the main thread where workers are missing.
 */
export function useBodyMeshes(enabled = true): BodyMeshes | null {
  const [meshes, setMeshes] = useState<BodyMeshes | null>(null);
  useEffect(() => {
    if (!enabled) return;
    if (typeof Worker === "undefined") {
      const timer = setTimeout(() => setMeshes(buildBodyMeshes()), 0);
      return () => clearTimeout(timer);
    }
    const worker = new Worker(new URL("./body-meshes.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<BodyMeshes>) => {
      setMeshes(e.data);
      worker.terminate();
    };
    worker.postMessage(null);
    return () => worker.terminate();
  }, [enabled]);
  return meshes;
}

function useBodyGeometry(meshes: BodyMeshes) {
  const geometry = useMemo(() => {
    const body = toGeometry(meshes.body, meshes.body.shellIndexCount);
    const flash = toGeometry(meshes.flash);
    flash.translate(-FLASH_HINGE[0], -FLASH_HINGE[1], -FLASH_HINGE[2]);
    // Red swoosh hugging the front of the grip.
    const swooshPoints = [
      [0.345, 0.215],
      [0.4, 0.205],
      [0.47, 0.185],
      [0.54, 0.165],
      [0.6, 0.145],
    ].map(([x, y]) => new Vector3(...lift(onFront(x, y), 0.004)));
    const swoosh = new TubeGeometry(new CatmullRomCurve3(swooshPoints), 64, 0.008, 10, false);
    return { body, flash, swoosh };
  }, [meshes]);
  useEffect(() => () => Object.values(geometry).forEach((g) => g.dispose()), [geometry]);
  return geometry;
}

type Material = Materials[keyof Materials];

/** Push button sitting on the shell, oriented by the surface; presses in while selected. */
function SurfaceButton({ spot, pressed, material, radius = 0.03, label }: { spot: Spot; pressed: boolean; material: Material; radius?: number; label?: Texture }) {
  const q = useMemo(() => align(spot.normal), [spot.normal]);
  return (
    <group position={spot.position} quaternion={q}>
      <Animated pose={(t) => ({ position: [0, pressed && t % 1.4 < 0.18 ? -0.008 : 0, 0] })} lambda={18}>
        <mesh position={[0, 0.006, 0]} material={material} castShadow>
          <cylinderGeometry args={[radius, radius * 1.04, 0.022, 40]} />
        </mesh>
        {/* Label turned half a turn so the text reads upright from the photographer's side. */}
        {label && (
          <mesh position={[0, 0.0175, 0]} rotation={[-Math.PI / 2, 0, Math.PI]}>
            <planeGeometry args={[radius * 1.7, radius * 0.85]} />
            <meshBasicMaterial map={label} transparent toneMapped={false} />
          </mesh>
        )}
      </Animated>
    </group>
  );
}

/** Flat decal laid on the shell. */
function Decal({ spot, size, map, rotation = 0 }: { spot: Spot; size: [number, number]; map: Texture; rotation?: number }) {
  const q = useMemo(() => align(spot.normal), [spot.normal]);
  return (
    <group position={lift(spot, 0.002)} quaternion={q}>
      <mesh rotation={[-Math.PI / 2, 0, rotation]}>
        <planeGeometry args={size} />
        <meshBasicMaterial map={map} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Direction of the live view lever, around the mode dial: towards the grip and the back. */
const LV_ANGLE = Math.atan2(0.095, 0.1);

/**
 * Live view switch: a chamfered collar under the mode dial, and a raised
 * paddle that tapers to a rounded tip, with grip ridges and an "Lv" mark.
 */
function useLiveViewGeometry() {
  const geometry = useMemo(() => {
    const collar = new LatheGeometry(
      [
        [0.118, 0],
        [0.136, 0],
        [0.14, 0.006],
        [0.14, 0.016],
        [0.132, 0.024],
        [0.118, 0.024],
      ].map(([r, y]) => new Vector2(r, y)),
      96,
    );
    // Paddle drawn flat (x outwards from the dial axis, z across), then stood up.
    const p = new Shape();
    p.moveTo(0.11, -0.034);
    p.lineTo(0.175, -0.022);
    p.quadraticCurveTo(0.2, -0.018, 0.2, 0);
    p.quadraticCurveTo(0.2, 0.018, 0.175, 0.022);
    p.lineTo(0.11, 0.034);
    p.lineTo(0.11, -0.034);
    const paddle = new ExtrudeGeometry(p, { depth: 0.016, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 4, curveSegments: 16 });
    paddle.rotateX(-Math.PI / 2);
    // Top slightly lower at the tip, as the lever thins out.
    deformPaddle(paddle);
    return { collar, paddle };
  }, []);
  useEffect(() => () => Object.values(geometry).forEach((g) => g.dispose()), [geometry]);
  return geometry;
}

function deformPaddle(geometry: BufferGeometry) {
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    if (y > 0.01) pos.setY(i, y - Math.max(0, x - 0.15) * 0.15);
  }
  geometry.computeVertexNormals();
}

/** Small grid of holes for the microphone or the speaker. */
function Holes({ spot, m, count = 3 }: { spot: Spot; m: Materials; count?: number }) {
  const q = useMemo(() => align(spot.normal), [spot.normal]);
  return (
    <group position={spot.position} quaternion={q}>
      {Array.from({ length: count }, (_, k) => (
        <mesh key={k} position={[(k % 3) * 0.016 - 0.016, 0.001, Math.floor(k / 3) * 0.016]} material={m.glassDark}>
          <cylinderGeometry args={[0.004, 0.004, 0.003, 12]} />
        </mesh>
      ))}
    </group>
  );
}

export interface BodyState {
  selected: BodyAnchor | null;
  exploded: boolean;
  meshes: BodyMeshes;
}

export function BodyModel({ selected, exploded, meshes }: BodyState) {
  const m = useMaterials();
  const geometry = useBodyGeometry(meshes);
  const lv = useLiveViewGeometry();
  const is = (...anchors: BodyAnchor[]) => selected !== null && anchors.includes(selected);
  const x = exploded ? 1 : 0;

  const textures = useMemo(
    () => ({
      dial: flipX(radialLabels({ labels: MODE_LABELS, highlight: "A" })),
      screen: flipX(infoScreen({ shutter: "1/125", aperture: "f/5,6", iso: "100", mode: "A" })),
      model: flipX(engraving("D3500", { width: 512, height: 128, size: 82, weight: 600 })),
      menu: flipX(engraving("MENU", { size: 54 })),
      i: flipX(engraving("i", { size: 96, weight: 800 })),
      lv: flipX(engraving("Lv", { size: 76 })),
      play: flipX(engraving("▶", { size: 76 })),
      zoom: flipX(engraving("+", { size: 96 })),
      help: flipX(engraving("?", { size: 84 })),
      flash: flipX(engraving("⚡", { size: 76 })),
      release: flipX(engraving("⏱", { size: 70 })),
      del: flipX(engraving("🗑", { size: 70 })),
      ae: flipX(engraving("AE-L", { size: 52 })),
      plusMinus: flipX(engraving("+/-", { size: 70 })),
      info: flipX(engraving("info", { size: 60 })),
      on: flipX(engraving("ON  OFF", { width: 512, size: 60 })),
    }),
    [],
  );
  useEffect(() => () => Object.values(textures).forEach((t: Texture) => t.dispose()), [textures]);

  const lensState: LensState = {
    extension: is("zoom-ring") || exploded ? 1 : 0,
    zoomTurn: is("zoom-ring") ? -0.9 : 0,
    focusTurn: is("focus-ring") ? 1.2 : 0,
  };
  const lensPose: Pose = is("lens-release") ? { position: [0, 0, 0.14], rotation: [0, 0, 0.9] } : { position: [0, 0, 0.7 * x], rotation: [0, 0, 0] };
  const flashUp = is("built-in-flash", "flash-button") || exploded;
  const cardOut = is("card-slot") || exploded;
  const shutterQ = useMemo(() => align(S.shutter.normal), []);
  const flashWindowQ = useMemo(() => align(FLASH_WINDOW.normal), []);
  const rearButtons: [BodyAnchor, Spot, Texture][] = [
    ["info-button", S.info, textures.info],
    ["ae-af-lock-button", S.aeLock, textures.ae],
    ["playback-button", S.playback, textures.play],
    ["menu-button", S.menu, textures.menu],
    ["i-button", S.i, textures.i],
    ["release-mode-button", S.releaseMode, textures.release],
    ["zoom-button", S.zoom, textures.zoom],
    ["help-button", S.help, textures.help],
    ["delete-button", S.del, textures.del],
    ["flash-button", S.flashButton, textures.flash],
  ];
  const windowAt = lift(FLASH_WINDOW, -0.001);

  return (
    <group scale={[-1, 1, 1]}>
      {/* Moulded shell with its rubber covered grip, and the red swoosh */}
      <mesh geometry={geometry.body} material={[m.shell, m.leather]} castShadow receiveShadow />
      <mesh geometry={geometry.swoosh} material={m.red} />
      <Decal spot={S.modelName} size={[0.13, 0.032]} map={textures.model} />
      {/* Strap lugs */}
      {[S.lugLeft, S.lugRight].map((lug, i) => (
        <mesh key={i} position={lift(lug, 0.012)} rotation={[0, Math.PI / 2, 0]} material={m.chrome}>
          <torusGeometry args={[0.03, 0.008, 12, 32]} />
        </mesh>
      ))}

      {/* Lens on its mount, screwed on at load time */}
      <group position={MOUNT}>
        <Animated pose={lensPose} from={{ position: [0, 0, 0.9], rotation: [0, 0, -1.4] }} lambda={4}>
          <LensModel m={m} state={lensState} name="AF-P NIKKOR 18-55 mm 1:3.5-5.6 G" focals={[18, 24, 35, 45, 55]} />
        </Animated>
      </group>

      {/* Pop up flash: the front top of the prism, flush when closed, lifted on two hinge arms when open */}
      <group position={FLASH_HINGE}>
        <Animated pose={{ position: [0, flashUp ? 0.06 : 0, flashUp ? 0.015 : 0], rotation: [flashUp ? -0.42 : 0, 0, 0] }} lambda={6}>
          <mesh geometry={geometry.flash} material={m.shell} castShadow receiveShadow />
          {/* Frosted window set into the sloped front */}
          <group position={[windowAt[0] - FLASH_HINGE[0], windowAt[1] - FLASH_HINGE[1], windowAt[2] - FLASH_HINGE[2]]} quaternion={flashWindowQ}>
            <RoundedBox args={[0.3, 0.01, 0.05]} radius={0.004} smoothness={3} position={[0, -0.002, 0]}>
              {/* Smoky when idle, white hot when it fires */}
              <meshPhysicalMaterial
                color={flashUp && is("built-in-flash") ? "#e8e6df" : "#2c2e33"}
                emissive="#ffffff"
                emissiveIntensity={flashUp && is("built-in-flash") ? 5 : 0}
                toneMapped={false}
                roughness={0.38}
                clearcoat={0.8}
                clearcoatRoughness={0.2}
              />
            </RoundedBox>
          </group>
          {/* Hinge arms: hidden inside the prism when closed */}
          {[-0.17, 0.17].map((ax) => (
            <mesh key={ax} position={[ax * 0.85, -0.045, 0.02]} rotation={[0.35, 0, 0]} material={m.plastic}>
              <boxGeometry args={[0.018, 0.09, 0.03]} />
            </mesh>
          ))}
        </Animated>
      </group>
      {/* Glossy plate on the prism front, under the flash */}
      <group position={lift(PRISM_PLATE, 0.003)} quaternion={align(PRISM_PLATE.normal)}>
        <RoundedBox args={[0.24, 0.006, 0.06]} radius={0.003} smoothness={3} material={m.button} />
      </group>
      {/* Hot shoe */}
      <group position={S.hotShoe.position}>
        <mesh position={[0, 0.006, 0]} material={m.metal}>
          <boxGeometry args={[0.2, 0.012, 0.18]} />
        </mesh>
        {[-0.085, 0.085].map((rx) => (
          <mesh key={rx} position={[rx, 0.016, 0]} material={m.chrome}>
            <boxGeometry args={[0.025, 0.018, 0.18]} />
          </mesh>
        ))}
      </group>

      {/* Mode dial on its shoulder: labels on top, knurled edge; it steps through the modes when selected */}
      <group position={S.modeDial.position}>
        <Animated
          pose={(t) => ({
            position: [0, 0.2 * x, 0],
            rotation: [0, is("mode-dial") ? -Math.floor(t / 0.9) * ((Math.PI * 2) / MODE_LABELS.length) : 0, 0],
          })}
          lambda={9}
        >
          <mesh position={[0, 0.03, 0]} material={m.dialRibs} castShadow>
            <cylinderGeometry args={[0.112, 0.118, 0.065, 64]} />
          </mesh>
          <mesh position={[0, 0.0635, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.11, 64]} />
            <meshStandardMaterial map={textures.dial} roughness={0.5} />
          </mesh>
        </Animated>
        <mesh position={[0, 0.065, -0.128]} material={m.chrome}>
          <boxGeometry args={[0.01, 0.012, 0.02]} />
        </mesh>
        {/* Live view switch: spring loaded, it swings when pulled and snaps back */}
        <Animated pose={(t) => ({ rotation: [0, LV_ANGLE + (is("live-view-switch") && t % 1.6 < 0.5 ? -0.4 : 0), 0] })} lambda={12}>
          <mesh geometry={lv.collar} material={m.button} castShadow receiveShadow />
          <mesh geometry={lv.paddle} position={[0, 0.002, 0]} material={m.button} castShadow />
          {/* Grip ridges near the tip */}
          {[0.158, 0.168, 0.178].map((rx) => (
            <mesh key={rx} position={[rx, 0.026 - (rx - 0.15) * 0.15, 0]} material={m.plastic}>
              <boxGeometry args={[0.003, 0.003, 0.03]} />
            </mesh>
          ))}
          <mesh position={[0.132, 0.0275, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
            <planeGeometry args={[0.036, 0.018]} />
            <meshBasicMaterial map={textures.lv} transparent toneMapped={false} />
          </mesh>
        </Animated>
      </group>

      {/* Shutter release on the slope of the grip, inside the ON/OFF collar */}
      <group position={S.shutter.position} quaternion={shutterQ}>
        <Animated pose={{ rotation: [0, is("power-switch") ? 0.55 : 0, 0] }} lambda={8}>
          <mesh position={[0, 0.008, 0]} material={m.fineRibs} castShadow>
            <cylinderGeometry args={[0.088, 0.092, 0.024, 64]} />
          </mesh>
          <mesh position={[0.1, 0.008, 0]} material={m.plastic}>
            <boxGeometry args={[0.045, 0.02, 0.032]} />
          </mesh>
        </Animated>
        <mesh position={[0, 0.0215, -0.11]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.13, 0.03]} />
          <meshBasicMaterial map={textures.on} transparent toneMapped={false} />
        </mesh>
        <Animated
          pose={(t) => ({ position: [0, is("shutter-button") ? (t % 1.6 < 0.3 ? -0.006 : t % 1.6 < 0.6 ? -0.014 : 0) : 0, 0] })}
          lambda={20}
        >
          <mesh position={[0, 0.032, 0]} material={m.chrome} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.032, 48]} />
          </mesh>
        </Animated>
      </group>
      {/* Top buttons behind the shutter release, and the red movie record button */}
      <SurfaceButton spot={S.plusMinus} pressed={is("exposure-compensation-button")} material={m.button} label={textures.plusMinus} />
      <SurfaceButton spot={S.record} pressed={is("movie-record-button")} material={m.red} radius={0.022} />

      {/* Command dial, horizontal at the rear corner, under the thumb */}
      <group position={[0.5, S.commandDialTop.position[1] - 0.04, S.commandDialBack.position[2] + 0.03]}>
        <Animated pose={(t) => ({ rotation: [0, is("command-dial") ? Math.sin(t * 2.4) * 0.6 : 0, 0] })} lambda={6}>
          <mesh material={m.dialRibs} castShadow>
            <cylinderGeometry args={[0.085, 0.085, 0.05, 64]} />
          </mesh>
        </Animated>
      </group>

      {/* Back: screen, eyecup, diopter, buttons to the right of the screen */}
      <group position={S.screen.position}>
        <RoundedBox args={[0.64, 0.48, 0.02]} radius={0.014} smoothness={3} position={[0, 0, 0.002]} material={m.glassDark} />
        <mesh position={[0, 0, -0.0095]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.58, 0.42]} />
          <meshStandardMaterial
            map={textures.screen}
            emissiveMap={textures.screen}
            emissive="#ffffff"
            emissiveIntensity={is("rear-screen") ? 1.4 : 0.55}
            toneMapped={!is("rear-screen")}
            roughness={0.12}
          />
        </mesh>
      </group>
      <Animated pose={{ position: [0, 0, -0.2 * x] }}>
        <RoundedBox args={[0.28, 0.18, 0.08]} radius={0.045} smoothness={6} position={lift(S.eyepiece, 0.03)} material={m.leather} />
        <mesh position={lift(S.eyepiece, 0.071)} rotation={[0, Math.PI, 0]} material={m.glassDark}>
          <planeGeometry args={[0.15, 0.08]} />
        </mesh>
      </Animated>
      <group position={lift(S.diopter, 0.012)}>
        <Animated pose={(t) => ({ rotation: [is("diopter") ? Math.sin(t * 3) * 0.8 : 0, 0, 0] })}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={m.fineRibs}>
            <cylinderGeometry args={[0.022, 0.022, 0.035, 24]} />
          </mesh>
        </Animated>
      </group>
      {rearButtons.map(([anchor, spot, label]) => (
        <SurfaceButton key={anchor} spot={spot} pressed={is(anchor)} material={m.button} label={label} />
      ))}
      <SurfaceButton spot={S.multi} pressed={false} material={m.button} radius={0.095} />
      <SurfaceButton spot={{ position: lift(S.multi, 0.01), normal: S.multi.normal }} pressed={is("multi-selector")} material={m.chrome} radius={0.038} />

      {/* Front: lens release, microphone holes, AF assist lamp */}
      <SurfaceButton spot={S.lensRelease} pressed={is("lens-release")} material={m.chrome} radius={0.032} />
      <Holes spot={S.microphone} m={m} />
      <Holes spot={S.speaker} m={m} count={6} />
      {/* Memory card access lamp */}
      <group position={S.cardLamp.position} quaternion={align(S.cardLamp.normal)}>
        <mesh position={[0, 0.002, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.004, 16]} />
          <meshStandardMaterial color="#3a1c12" emissive="#ff6a2a" emissiveIntensity={is("card-access-lamp") ? 4 : 0} toneMapped={false} />
        </mesh>
      </group>
      <group position={S.afLamp.position} quaternion={align(S.afLamp.normal)}>
        <mesh position={[0, 0.004, 0]}>
          <cylinderGeometry args={[0.028, 0.03, 0.012, 32]} />
          <meshPhysicalMaterial
            color="#f2e3c8"
            emissive="#ffb347"
            emissiveIntensity={is("af-assist-lamp") ? 6 : 0.12}
            toneMapped={false}
            roughness={0.05}
            clearcoat={1}
          />
        </mesh>
      </group>

      {/* Grip side: card door swinging open, SD card sliding out */}
      <group position={lift(S.cardDoor, 0.004)}>
        <group position={[0, 0, -0.17]}>
          <Animated pose={{ rotation: [0, cardOut ? -1.2 : 0, 0] }} lambda={6}>
            <mesh position={[0, 0, 0.17]} rotation={[0, Math.PI / 2, 0]} material={m.leather}>
              <planeGeometry args={[0.3, 0.24]} />
            </mesh>
          </Animated>
        </group>
        <Animated pose={{ position: [cardOut ? 0.2 : -0.12, 0, 0] }} lambda={5}>
          <mesh>
            <boxGeometry args={[0.02, 0.24, 0.32]} />
            <meshStandardMaterial color="#1d4fa0" roughness={0.4} />
          </mesh>
        </Animated>
      </group>

      {/* Bottom of the grip: battery sliding out */}
      <group position={[0.47, S.battery.position[1], 0.06]}>
        <Animated pose={{ position: [0, is("battery") || exploded ? -0.15 : 0.26, 0] }} lambda={5}>
          <RoundedBox args={[0.2, 0.5, 0.36]} radius={0.02} smoothness={3}>
            <meshStandardMaterial color="#2a2b30" roughness={0.6} />
          </RoundedBox>
          <mesh position={[0, -0.252, 0.1]} material={m.chrome}>
            <boxGeometry args={[0.12, 0.004, 0.04]} />
          </mesh>
        </Animated>
      </group>

      {/* Port cover on the left side, hinged at its back edge */}
      <group position={[S.ports.position[0] - 0.006, S.ports.position[1], -0.2]}>
        <Animated pose={{ rotation: [0, is("ports") ? 0.8 : 0, 0] }}>
          <RoundedBox args={[0.02, 0.3, 0.28]} radius={0.008} smoothness={3} position={[0, 0, 0.15]} material={m.leather} />
        </Animated>
      </group>
    </group>
  );
}
