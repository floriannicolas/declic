"use client";

import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import { BufferAttribute, BufferGeometry, Quaternion, Vector3, type Texture } from "three";
import type { BodyAnchor } from "@/types";
import { Animated, type Pose } from "./animated";
import { MOUNT_MM, bodyDistance, buildBodyMeshes, flashDistance, fromMm, hitBody, type BodyMeshes, type MeshData, type V3 } from "./body-sdf";
import { LensModel, type LensState } from "./lens-model";
import { useMaterials, type Materials } from "./materials";
import { engraving, flipX, infoScreen, modeDialTop, type DialStop } from "./textures";

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

/**
 * Every control, positioned on the shell once at module load (pure math).
 * Measured on Nikon's product renders and a rear photo, in millimetres from the
 * centre of the base at the mount face (see body-outlines), then cast onto the shell.
 */
const top = (x: number, z: number) => {
  const [px, , pz] = fromMm(x, 0, z);
  return onTop(px, pz);
};
const back = (x: number, y: number) => {
  const [px, py] = fromMm(x, y, 0);
  return onBack(px, py);
};
const front = (x: number, y: number) => {
  const [px, py] = fromMm(x, y, 0);
  return onFront(px, py);
};
const side = (s: 1 | -1, y: number, z: number) => {
  const [, py, pz] = fromMm(0, y, z);
  return onSide(s, py, pz);
};

const S = {
  shutter: top(36.2, -11.4),
  power: top(37.9, -5.5),
  modeDial: top(20.5, -39.8),
  plusMinus: top(46.4, -25.6),
  record: top(31.8, -25.6),
  hotShoe: top(-16.7, -46),
  commandDial: top(42.3, -46.3),
  screen: back(-23.5, 29.8),
  eyepiece: back(-16.7, 72),
  diopter: back(3.4, 72.5),
  // Rear, after the reference manual and photos: flash button left of the eyecup,
  // info and AE-L/AF-L right of it, then the column right of the monitor.
  flashButton: back(-45, 67.1),
  info: back(14, 68.1),
  aeLock: back(26.3, 68.5),
  playback: back(20.4, 53),
  menu: back(20.4, 42.6),
  i: back(31.2, 42.6),
  multi: back(26.7, 28),
  zoom: back(20.4, 15.2),
  help: back(20.4, 6.7),
  releaseMode: back(33, 15.2),
  del: back(33, 6.4),
  cardLamp: back(41.6, 11.6),
  lensRelease: front(-54.9, 39.3),
  microphone: front(-52.7, 60.3),
  afLamp: front(19.8, 67.9),
  modelName: front(-52.4, 64.5),
  logo: front(MOUNT_MM.x, 88.6),
  speaker: side(-1, 76, -38),
  cardDoor: side(1, 22.7, -46),
  ports: side(-1, 30.4, -45),
  lugLeft: side(-1, 68, -41.5),
  lugRight: side(1, 68, -41.5),
  battery: cast(fromMm(43, -20, -22), [0, 1, 0]),
};
/** Flash window, on the front edge of the lid, just above the "Nikon" face. */
const FLASH_WINDOW = cast(fromMm(MOUNT_MM.x, 91.6, 30), [0, 0, -1], flashDistance);
/** Hinge of the pop up flash, at the back of the lid, just ahead of the hot shoe. */
const FLASH_HINGE: Vec3 = fromMm(MOUNT_MM.x, 90, -33);

/** Inscriptions around the front element of the AF-P DX 18-55 mm kit lens. */
const LENS_FRONT = [
  { text: "Nikon AF-P DX NIKKOR", at: 0 },
  { text: "18-55mm 1:3.5-5.6G VR", at: Math.PI / 2 },
  { text: "∞-0.25m/0.82ft ⌀55", at: -Math.PI / 2 },
];

/** Lens mount centre, on the mount face. */
const MOUNT: Vec3 = fromMm(MOUNT_MM.x, MOUNT_MM.y, 0);

/** Direction of the live view lever from the mode dial axis: towards the grip, slightly forward. */
const LV_ANGLE = Math.atan2(2.5, 14);

const MARK = 0.012;
const LAYOUT: Partial<Record<BodyAnchor, AnchorSpot>> = {
  "shutter-button": { position: lift(S.shutter, 0.06), normal: S.shutter.normal },
  "power-switch": { position: lift(S.power, 0.03), normal: S.power.normal },
  "mode-dial": { position: lift(S.modeDial, 0.1), normal: [0, 1, 0] },
  "command-dial": { position: lift(S.commandDial, 0.05), normal: [0, 0.6, -1] },
  "exposure-compensation-button": { position: lift(S.plusMinus, 0.03), normal: S.plusMinus.normal },
  "movie-record-button": { position: lift(S.record, 0.03), normal: S.record.normal },
  // On the top of the lever, which stands out from the mode dial along LV_ANGLE.
  "live-view-switch": {
    position: [S.modeDial.position[0] + 0.138 * Math.cos(LV_ANGLE), S.modeDial.position[1] + 0.045, S.modeDial.position[2] - 0.138 * Math.sin(LV_ANGLE)],
    normal: [0.3, 0.8, -0.5],
  },
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
  viewfinder: { position: lift(S.eyepiece, 0.09), normal: S.eyepiece.normal },
  diopter: { position: lift(S.diopter, 0.03), normal: S.diopter.normal },
  "built-in-flash": { position: lift(FLASH_WINDOW, 0.02), normal: FLASH_WINDOW.normal },
  "hot-shoe": { position: lift(S.hotShoe, 0.03), normal: S.hotShoe.normal },
  "flash-button": { position: lift(S.flashButton, MARK), normal: S.flashButton.normal },
  "lens-release": { position: lift(S.lensRelease, MARK), normal: S.lensRelease.normal },
  "zoom-ring": { position: [MOUNT[0], MOUNT[1] + 0.34, 0.47], normal: [0, 1, 0] },
  "focus-ring": { position: [MOUNT[0], MOUNT[1] + 0.32, 0.79], normal: [0, 1, 0] },
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

const DEG = Math.PI / 180;
/** Mode dial print, after Nikon's illustration of the D3500 (angles seen from above, clockwise). */
const MODE_DIAL: DialStop[] = [
  { at: -85 * DEG, label: "P", size: 0.13 },
  { at: -66 * DEG, label: "S", size: 0.13 },
  { at: -47 * DEG, label: "A", size: 0.13 },
  { at: -28 * DEG, label: "M", size: 0.13 },
  { at: 17 * DEG, label: "EFFECTS", radial: true, size: 0.085 },
  { at: 45 * DEG, icon: "night-portrait" },
  { at: 72 * DEG, icon: "close-up" },
  { at: 103 * DEG, icon: "sports" },
  { at: 133 * DEG, icon: "child" },
  { at: 162 * DEG, icon: "flash-off" },
  { at: 206 * DEG, icon: "auto" },
  { at: 235 * DEG, label: "GUIDE", size: 0.095 },
];
/** Turn of the dial that brings P to the index mark. */
const DIAL_BASE = -0.19;
/** Dial turn bringing a given stop to the index, used to step through the modes. */
const dialTurn = (i: number) => DIAL_BASE + (MODE_DIAL[i].at - MODE_DIAL[0].at);

/** Rotation turning local +y onto a surface normal. */
const align = (normal: Vec3) => new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(...normal).normalize());

function toGeometry(mesh: MeshData, shellIndexCount?: number) {
  const g = new BufferGeometry();
  // Copied: the meshes come from the worker once, while this may run again (and translate) on remount.
  g.setAttribute("position", new BufferAttribute(mesh.positions.slice(), 3));
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
    return { body, flash, swoosh: surfaceRibbon(SWOOSH_TOP, SWOOSH_BOTTOM) };
  }, [meshes]);
  useEffect(() => () => Object.values(geometry).forEach((g) => g.dispose()), [geometry]);
  return geometry;
}

/** Red stripe across the top of the grip, as seen from the front: its two edges in millimetres. */
const SWOOSH_TOP: [number, number][] = [[55.5, 60.4], [54, 62], [44.2, 64.4], [35.3, 66.2], [27.6, 67.6], [25.4, 66.8]];
const SWOOSH_BOTTOM: [number, number][] = [[55.5, 60.4], [53, 59.4], [44.2, 60.2], [35.3, 61.6], [27.6, 63.4], [25.4, 66.8]];

/** Point along a polyline, t from 0 to 1, by arc length. */
function along(points: [number, number][], t: number): [number, number] {
  const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  let d = t * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (d <= lengths[i] || i === lengths.length - 1) {
      const u = Math.min(d / (lengths[i] || 1), 1);
      return [points[i][0] + (points[i + 1][0] - points[i][0]) * u, points[i][1] + (points[i + 1][1] - points[i][1]) * u];
    }
    d -= lengths[i];
  }
  return points[points.length - 1];
}

/** Thin strip laid on the front of the shell between two outlines, like a painted inlay. */
function surfaceRibbon(topEdge: [number, number][], bottomEdge: [number, number][], segments = 48, rows = 6) {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let k = 0; k <= segments; k++) {
    const [tx, ty] = along(topEdge, k / segments);
    const [bx, by] = along(bottomEdge, k / segments);
    // Several rows across, so the strip follows the curve of the grip instead of cutting through it.
    for (let r = 0; r <= rows; r++) {
      const u = r / rows;
      const [px, py] = fromMm(tx + (bx - tx) * u, ty + (by - ty) * u, 0);
      positions.push(...lift(onFront(px, py), 0.0012));
      if (k > 0 && r > 0) {
        const a = (k - 1) * (rows + 1) + r - 1;
        const c = k * (rows + 1) + r - 1;
        indices.push(a, a + 1, c, a + 1, c + 1, c);
      }
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
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
  const is = (...anchors: BodyAnchor[]) => selected !== null && anchors.includes(selected);
  const x = exploded ? 1 : 0;

  const textures = useMemo(
    () => ({
      dial: flipX(modeDialTop(MODE_DIAL, [-94 * DEG, -16 * DEG])),
      // As in the reference manual: programmed auto, 1/125 s at f/5.6, ISO 100.
      screen: flipX(infoScreen({ shutter: "1/125", aperture: "5.6", iso: "100", mode: "P" })),
      model: flipX(engraving("D3500", { width: 512, height: 128, size: 82, weight: 600 })),
      menu: flipX(engraving("MENU", { size: 54 })),
      i: flipX(engraving("i", { size: 96, weight: 800 })),
      lv: flipX(engraving("Lv", { size: 70, boxed: true })),
      play: flipX(engraving("▶", { size: 76 })),
      zoom: flipX(engraving("+", { size: 96 })),
      help: flipX(engraving("?", { size: 84 })),
      flash: flipX(engraving("⚡", { size: 76 })),
      brand: flipX(engraving("Nikon", { width: 512, height: 128, size: 112, weight: 800, color: "#f4f4f2" })),
      ok: flipX(engraving("OK", { size: 70 })),
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
      <Decal spot={S.modelName} size={[0.11, 0.028]} map={textures.model} />
      {/* Strap lugs */}
      {[S.lugLeft, S.lugRight].map((lug, i) => (
        <mesh key={i} position={lift(lug, 0.012)} rotation={[0, Math.PI / 2, 0]} material={m.chrome}>
          <torusGeometry args={[0.03, 0.008, 12, 32]} />
        </mesh>
      ))}

      {/* Bayonet: brushed metal flange around the mount throat, seen when the lens comes off */}
      <mesh position={[MOUNT[0], MOUNT[1], MOUNT[2] - 0.006]} material={m.metal}>
        <ringGeometry args={[0.225, 0.29, 96]} />
      </mesh>
      {/* Lens on its mount, screwed on at load time */}
      <group position={MOUNT}>
        <Animated pose={lensPose} from={{ position: [0, 0, 0.9], rotation: [0, 0, -1.4] }} lambda={4}>
          <LensModel m={m} state={lensState} name="AF-P NIKKOR 18-55 mm 1:3.5-5.6 G" focals={[18, 24, 35, 45, 55]} inscriptions={LENS_FRONT} />
        </Animated>
      </group>

      {/* Pop up flash: the front top of the prism, flush when closed, lifted on two hinge arms when open */}
      <group position={FLASH_HINGE}>
        <Animated pose={{ position: [0, flashUp ? 0.06 : 0, flashUp ? 0.015 : 0], rotation: [flashUp ? -0.42 : 0, 0, 0] }} lambda={6}>
          <mesh geometry={geometry.flash} material={m.shell} castShadow receiveShadow />
          {/* Frosted window set into the sloped front */}
          <group position={[windowAt[0] - FLASH_HINGE[0], windowAt[1] - FLASH_HINGE[1], windowAt[2] - FLASH_HINGE[2]]} quaternion={flashWindowQ}>
            <RoundedBox args={[0.3, 0.01, 0.034]} radius={0.004} smoothness={3} position={[0, -0.002, 0]}>
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
      {/* Brand on the front of the hood: it stays put when the flash lid rises */}
      <Decal spot={S.logo} size={[0.25, 0.0625]} map={textures.brand} />
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
            rotation: [0, is("mode-dial") ? dialTurn(Math.floor(t / 0.9) % MODE_DIAL.length) : DIAL_BASE, 0],
          })}
          lambda={9}
        >
          <mesh position={[0, 0.03, 0]} material={m.dialRibs} castShadow>
            <cylinderGeometry args={[0.1, 0.104, 0.065, 64]} />
          </mesh>
          <mesh position={[0, 0.0635, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.098, 64]} />
            <meshStandardMaterial map={textures.dial} roughness={0.5} />
          </mesh>
        </Animated>
        <mesh position={[-0.112, 0.062, 0]} material={m.chrome}>
          <boxGeometry args={[0.01, 0.012, 0.02]} />
        </mesh>
        {/*
          Live view switch: a small rectangular block coming out from under the
          mode dial, towards the command dial, lower than the dial top, with "Lv"
          printed in a box. Spring loaded: it swings when pulled and snaps back.
        */}
        <Animated pose={(t) => ({ rotation: [0, LV_ANGLE + (is("live-view-switch") && t % 1.6 < 0.5 ? 0.35 : 0), 0] })} lambda={12}>
          <RoundedBox args={[0.078, 0.034, 0.052]} radius={0.008} smoothness={4} position={[0.134, 0.017, 0]} material={m.button} castShadow receiveShadow />
          {/* Slight bevel on the top face, catching the light like the real part */}
          <RoundedBox args={[0.064, 0.004, 0.04]} radius={0.002} smoothness={2} position={[0.137, 0.0345, 0]} material={m.plastic} />
          {/* Upright for the photographer: the top of the letters points to the front */}
          <mesh position={[0.138, 0.0368, 0]} rotation={[-Math.PI / 2, 0, Math.PI]}>
            <planeGeometry args={[0.056, 0.028]} />
            <meshBasicMaterial map={textures.lv} transparent toneMapped={false} />
          </mesh>
        </Animated>
      </group>

      {/* Shutter release on the slope of the grip, inside the ON/OFF collar */}
      <group position={S.shutter.position} quaternion={shutterQ}>
        <Animated pose={{ rotation: [0, is("power-switch") ? 0.55 : 0, 0] }} lambda={8}>
          <mesh position={[0, 0.008, 0]} material={m.fineRibs} castShadow>
            <cylinderGeometry args={[0.08, 0.084, 0.024, 64]} />
          </mesh>
          {/* Power lever tab, pointing towards the lens */}
          <mesh position={[0.026, 0.008, 0.09]} rotation={[0, -1.28, 0]} material={m.plastic} castShadow>
            <boxGeometry args={[0.05, 0.022, 0.034]} />
          </mesh>
        </Animated>
        <mesh position={[0, 0.0215, -0.098]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.13, 0.03]} />
          <meshBasicMaterial map={textures.on} transparent toneMapped={false} />
        </mesh>
        <Animated
          pose={(t) => ({ position: [0, is("shutter-button") ? (t % 1.6 < 0.3 ? -0.006 : t % 1.6 < 0.6 ? -0.014 : 0) : 0, 0] })}
          lambda={20}
        >
          <mesh position={[0, 0.026, 0]} material={m.button} castShadow>
            <cylinderGeometry args={[0.045, 0.047, 0.02, 48]} />
          </mesh>
          <mesh position={[0, 0.036, 0]} scale={[1, 0.18, 1]} material={m.button}>
            <sphereGeometry args={[0.045, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
        </Animated>
      </group>
      {/* Top buttons behind the shutter release, and the red movie record button */}
      <SurfaceButton spot={S.plusMinus} pressed={is("exposure-compensation-button")} material={m.button} label={textures.plusMinus} />
      <SurfaceButton spot={S.record} pressed={is("movie-record-button")} material={m.red} radius={0.022} />

      {/* Command dial, horizontal at the rear corner, under the thumb */}
      <group position={S.commandDial.position}>
        <Animated pose={(t) => ({ rotation: [0, is("command-dial") ? Math.sin(t * 2.4) * 0.6 : 0, 0] })} lambda={6}>
          <mesh position={[0, -0.008, 0]} material={m.dialRibs} castShadow>
            <cylinderGeometry args={[0.088, 0.09, 0.05, 64]} />
          </mesh>
          {/* Spun finish on top */}
          <mesh position={[0, 0.0172, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.spun}>
            <circleGeometry args={[0.086, 64]} />
          </mesh>
        </Animated>
      </group>

      {/* Back: screen, eyecup, diopter, buttons to the right of the screen */}
      <group position={S.screen.position}>
        <RoundedBox args={[0.67, 0.52, 0.02]} radius={0.014} smoothness={3} position={[0, 0, 0.002]} material={m.glassDark} />
        <mesh position={[0, 0, -0.0095]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.61, 0.46]} />
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
        <RoundedBox args={[0.37, 0.21, 0.09]} radius={0.04} smoothness={6} position={lift(S.eyepiece, 0.04)} material={m.rubber} />
        <RoundedBox args={[0.17, 0.12, 0.02]} radius={0.012} smoothness={4} position={lift(S.eyepiece, 0.08)} material={m.plastic} />
        <mesh position={lift(S.eyepiece, 0.0905)} rotation={[0, Math.PI, 0]} material={m.glassDark}>
          <planeGeometry args={[0.12, 0.08]} />
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
      <SurfaceButton spot={S.multi} pressed={false} material={m.button} radius={0.088} />
      <SurfaceButton spot={{ position: lift(S.multi, 0.01), normal: S.multi.normal }} pressed={is("multi-selector")} material={m.button} radius={0.031} label={textures.ok} />

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
        <group position={[0, 0, -0.12]}>
          <Animated pose={{ rotation: [0, cardOut ? -1.2 : 0, 0] }} lambda={6}>
            {/* Shown only while open: closed, it is flush with the moulded side */}
            <mesh position={[0, 0, 0.12]} rotation={[0, Math.PI / 2, 0]} material={m.shell} visible={cardOut}>
              <planeGeometry args={[0.24, 0.32]} />
            </mesh>
          </Animated>
        </group>
        <Animated pose={{ position: [cardOut ? 0.2 : -0.12, 0, 0.04] }} lambda={5}>
          <mesh>
            <boxGeometry args={[0.02, 0.24, 0.2]} />
            <meshStandardMaterial color="#1d4fa0" roughness={0.4} />
          </mesh>
        </Animated>
      </group>

      {/* Bottom of the grip: battery sliding out */}
      <group position={[S.battery.position[0], S.battery.position[1], S.battery.position[2]]}>
        <Animated pose={{ position: [0, is("battery") || exploded ? -0.15 : 0.26, 0] }} lambda={5}>
          <RoundedBox args={[0.15, 0.48, 0.26]} radius={0.02} smoothness={3}>
            <meshStandardMaterial color="#2a2b30" roughness={0.6} />
          </RoundedBox>
          <mesh position={[0, -0.252, 0.1]} material={m.chrome}>
            <boxGeometry args={[0.12, 0.004, 0.04]} />
          </mesh>
        </Animated>
      </group>

      {/* Port cover on the left side, hinged at its back edge */}
      <group position={[S.ports.position[0] - 0.006, S.ports.position[1], S.ports.position[2] - 0.09]}>
        <Animated pose={{ rotation: [0, is("ports") ? 0.8 : 0, 0] }}>
          <RoundedBox args={[0.02, 0.35, 0.18]} radius={0.008} smoothness={3} position={[0, 0, 0.09]} material={m.rubber} visible={is("ports") || exploded} />
        </Animated>
      </group>
    </group>
  );
}
