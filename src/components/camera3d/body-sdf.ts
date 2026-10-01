/**
 * The D3500 body as a signed distance field. Its volume is carved from three
 * outlines traced from Nikon's orthographic renders (see body-outlines): the
 * intersection of their extrusions, with rounded edges, is the moulded shell.
 * The lens mount boss is added on top, and the pop up flash lid is cut from the
 * same field. A surface nets pass turns the field into one smooth mesh. Pure
 * math, no three.js import.
 *
 * Coordinates are the photographer's: x to the right (grip side), y up,
 * z forward, in decimetres.
 */
import { FRONT_OUTLINE, SIDE_OUTLINE, TOP_OUTLINE } from "./body-outlines";

export type V3 = [number, number, number];

const clamp = (x: number, a: number, b: number) => Math.min(Math.max(x, a), b);
const length3 = (x: number, y: number, z: number) => Math.sqrt(x * x + y * y + z * z);

/** Polynomial smooth minimum: blends two shapes over a band of width k. */
export function smin(a: number, b: number, k: number) {
  const h = clamp(0.5 + (0.5 * (b - a)) / k, 0, 1);
  return b * (1 - h) + a * h - k * h * (1 - h);
}
const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);

/** Body frame of the outlines (millimetres) to model units (decimetres). */
export const MM = 0.01;
/** Where the outline origin (centre of the base, at the mount face) sits in the model. */
export const ORIGIN: V3 = [0, -0.47, 0.2];
/** Model position of a point given in the outlines' millimetres. */
export const fromMm = (x: number, y: number, z: number): V3 => [ORIGIN[0] + x * MM, ORIGIN[1] + y * MM, ORIGIN[2] + z * MM];

/** Lens mount axis, in millimetres from the outline origin. */
export const MOUNT_MM = { x: -16.7, y: 39 };

/**
 * Signed distance to a closed outline, precomputed on a grid (0.5 mm) and
 * sampled bilinearly: thousands of times cheaper than walking the polygon for
 * each of the million samples of the body.
 */
class OutlineField {
  private readonly values: Float32Array;
  private readonly x0: number;
  private readonly y0: number;
  private readonly nx: number;
  private readonly ny: number;
  private static readonly CELL = 0.5;
  private static readonly MARGIN = 14;

  constructor(points: readonly (readonly [number, number])[]) {
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const { CELL, MARGIN } = OutlineField;
    this.x0 = Math.min(...xs) - MARGIN;
    this.y0 = Math.min(...ys) - MARGIN;
    this.nx = Math.ceil((Math.max(...xs) + MARGIN - this.x0) / CELL) + 1;
    this.ny = Math.ceil((Math.max(...ys) + MARGIN - this.y0) / CELL) + 1;
    this.values = new Float32Array(this.nx * this.ny);
    for (let j = 0; j < this.ny; j++)
      for (let i = 0; i < this.nx; i++) this.values[i + this.nx * j] = polygonDistance(points, this.x0 + i * CELL, this.y0 + j * CELL);
  }

  /** Distance in millimetres, negative inside. Beyond the grid, a lower bound. */
  at(x: number, y: number) {
    const { CELL } = OutlineField;
    const fx = clamp((x - this.x0) / CELL, 0, this.nx - 1.001);
    const fy = clamp((y - this.y0) / CELL, 0, this.ny - 1.001);
    const i = Math.floor(fx);
    const j = Math.floor(fy);
    const tx = fx - i;
    const ty = fy - j;
    const v = this.values;
    const k = i + this.nx * j;
    const inner = (v[k] * (1 - tx) + v[k + 1] * tx) * (1 - ty) + (v[k + this.nx] * (1 - tx) + v[k + this.nx + 1] * tx) * ty;
    const outside = Math.hypot(Math.max(this.x0 - x, x - (this.x0 + (this.nx - 1) * CELL), 0), Math.max(this.y0 - y, y - (this.y0 + (this.ny - 1) * CELL), 0));
    return inner + outside;
  }
}

/** Exact signed distance to a polygon (even odd rule for the sign). */
function polygonDistance(points: readonly (readonly [number, number])[], px: number, py: number) {
  // Squared distances in the loop, one square root at the end: this runs millions of times.
  let best = Infinity;
  let inside = false;
  for (let a = 0, b = points.length - 1; a < points.length; b = a++) {
    const ax = points[a][0];
    const ay = points[a][1];
    const bx = points[b][0];
    const by = points[b][1];
    const ex = bx - ax;
    const ey = by - ay;
    const wx = px - ax;
    const wy = py - ay;
    const t = clamp((wx * ex + wy * ey) / (ex * ex + ey * ey || 1), 0, 1);
    const dx = wx - ex * t;
    const dy = wy - ey * t;
    const d2 = dx * dx + dy * dy;
    if (d2 < best) best = d2;
    if (ay > py !== by > py && px < (ex * wy) / ey + ax) inside = !inside;
  }
  return inside ? -Math.sqrt(best) : Math.sqrt(best);
}

let outlines: { front: OutlineField; side: OutlineField; top: OutlineField } | null = null;
/** Built on first use, so importing the module (for the layout) stays cheap. */
function fields() {
  outlines ??= { front: new OutlineField(FRONT_OUTLINE), side: new OutlineField(SIDE_OUTLINE), top: new OutlineField(TOP_OUTLINE) };
  return outlines;
}

/** Round edged intersection of the three extruded outlines, in millimetres. */
function hullMm(x: number, y: number, z: number) {
  const f = fields();
  // Generous radii on the body and the grip, crisper ones on the prism and its hood.
  const body = clamp((78 - y) / 8, 0, 1);
  const grip = clamp((x - 22) / 18, 0, 1) * clamp((68 - y) / 8, 0, 1);
  const r = 4.5 + 2.5 * body + 7 * grip;
  const a = f.front.at(x, y) + r;
  const b = f.side.at(z, y) + r;
  const c = f.top.at(x, z) + r;
  return length3(Math.max(a, 0), Math.max(b, 0), Math.max(c, 0)) + Math.min(Math.max(a, b, c), 0) - r;
}

/** Cylinder of finite length along z, with rounded rims (millimetres). */
function cylinderZ(x: number, y: number, z: number, cx: number, cy: number, r: number, z0: number, z1: number, round = 0) {
  const d = Math.hypot(x - cx, y - cy) - r + round;
  const h = Math.abs(z - (z0 + z1) / 2) - (z1 - z0) / 2 + round;
  return Math.min(Math.max(d, h), 0) + Math.hypot(Math.max(d, 0), Math.max(h, 0)) - round;
}

/** Smooth bump: 1 in the middle of [a, b], easing to 0 at both ends. */
function bump(v: number, a: number, b: number) {
  const t = clamp((v - a) / (b - a), 0, 1);
  return 16 * t * t * (1 - t) * (1 - t);
}

/** Prism centre line and its half width at a given height: the sides lean inwards. */
const PRISM_X = -16.5;
const prismHalfWidth = (y: number) => 17 + (96 - y) * 0.48;

/** The whole moulded body, flash lid included, in millimetres. */
function solidMm(x: number, y: number, z: number) {
  let d = hullMm(x, y, z);
  // The grip front swells like a moulded handle, instead of a flat face.
  d -= 3.6 * bump(x, 18, 66) * bump(y, -12, 72) * clamp((z + 30) / 16, 0, 1);
  // Top of the grip sloping down towards the front, where the shutter release sits.
  const gripTop = ((y - 73.5) + (z + 19) * 0.6) / 1.17;
  d = smax(d, smin(gripTop, x - 22, 6), 5);
  // Prism sides leaning inwards above the shoulders.
  const prism = (Math.abs(x - PRISM_X) - prismHalfWidth(y)) * 0.9;
  d = smax(d, smin(prism, y - 76.5, 3), 3.5);
  // Raised boss around the lens mount, standing proud of the front face.
  d = smin(d, cylinderZ(x, y, z, MOUNT_MM.x, MOUNT_MM.y, 33.8, -10, -1, 1.6), 2.5);
  // Mount throat: the mirror box behind the bayonet.
  d = Math.max(d, -cylinderZ(x, y, z, MOUNT_MM.x, MOUNT_MM.y, 22.5, -26, 5));
  return d;
}

/**
 * Pop up flash lid: the top of the hood, in front of the hot shoe, above a
 * parting line sloping down towards the back. The "Nikon" face under its front
 * edge stays on the body. Negative inside, millimetres.
 */
function lidRegion(y: number, z: number) {
  const parting = 86 + (z + 35) * 0.098;
  return smax(parting - y, -35 - z, 1);
}

/** Width of the parting line around the flash, in millimetres. */
const FLASH_GAP = 0.3;

const toMm = (x: number, y: number, z: number): V3 => [(x - ORIGIN[0]) / MM, (y - ORIGIN[1]) / MM, (z - ORIGIN[2]) / MM];

/** Whole body except the pop up flash, with a fine parting line around it. */
export function bodyDistance(x: number, y: number, z: number) {
  const [mx, my, mz] = toMm(x, y, z);
  return Math.max(solidMm(mx, my, mz), FLASH_GAP - lidRegion(my, mz)) * MM;
}

/** The pop up flash lid, cut from the same field so it sits flush when closed. */
export function flashDistance(x: number, y: number, z: number) {
  const [mx, my, mz] = toMm(x, y, z);
  return Math.max(solidMm(mx, my, mz), lidRegion(my, mz) + FLASH_GAP) * MM;
}

/** Thumb rest on the back, as seen from behind: [x, y] in millimetres. */
const THUMB_REST: readonly (readonly [number, number])[] = [
  [27, 61.6], [61, 61.6], [61, 36.6], [40.6, 37.1], [29.1, 52.7],
];

/** True where the leather like covering applies: the front and side of the grip, and the thumb rest. */
export function isGrip(x: number, y: number, z: number) {
  const [mx, my, mz] = toMm(x, y, z);
  if (mz < -53) return polygonDistance(THUMB_REST, mx, my) < 0;
  // Under the red stripe, which rises towards the lens.
  const top = 59.8 + (53 - mx) * 0.155;
  // Inner edge along the finger channel, leaning towards the lens at the base.
  const inner = 26.5 - (63 - my) * 0.2;
  return mx > inner && my < top && my > 3 && mz > -31.5;
}

export interface MeshData {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

const CORNERS: V3[] = [
  [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
];
const EDGES: [number, number][] = [
  [0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7],
];

/**
 * Surface nets: one vertex per cell crossing the surface, placed at the mean
 * of its edge crossings, and one quad per grid edge crossing it. Smooth and
 * watertight, ideal for a moulded object. Normals come from the field gradient.
 */
export function surfaceNets(sdf: (x: number, y: number, z: number) => number, min: V3, max: V3, step: number, normalSpan = 0): MeshData {
  const n = [0, 1, 2].map((a) => Math.ceil((max[a] - min[a]) / step) + 1) as V3;
  const [nx, ny, nz] = n;
  const values = new Float32Array(nx * ny * nz);
  const at = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) values[at(i, j, k)] = sdf(min[0] + i * step, min[1] + j * step, min[2] + k * step);

  const cellVertex = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cellAt = (i: number, j: number, k: number) => i + (nx - 1) * (j + (ny - 1) * k);
  const positions: number[] = [];
  const corner = new Float32Array(8);

  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let inside = 0;
        for (let c = 0; c < 8; c++) {
          corner[c] = values[at(i + CORNERS[c][0], j + CORNERS[c][1], k + CORNERS[c][2])];
          if (corner[c] < 0) inside++;
        }
        if (inside === 0 || inside === 8) continue;
        let sx = 0;
        let sy = 0;
        let sz = 0;
        let count = 0;
        for (const [a, b] of EDGES) {
          const va = corner[a];
          const vb = corner[b];
          if (va < 0 === vb < 0) continue;
          const t = va / (va - vb);
          sx += CORNERS[a][0] + t * (CORNERS[b][0] - CORNERS[a][0]);
          sy += CORNERS[a][1] + t * (CORNERS[b][1] - CORNERS[a][1]);
          sz += CORNERS[a][2] + t * (CORNERS[b][2] - CORNERS[a][2]);
          count++;
        }
        cellVertex[cellAt(i, j, k)] = positions.length / 3;
        positions.push(min[0] + (i + sx / count) * step, min[1] + (j + sy / count) * step, min[2] + (k + sz / count) * step);
      }

  const indices: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) indices.push(a, c, b, a, d, c);
    else indices.push(a, b, c, a, c, d);
  };
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const v0 = values[at(i, j, k)];
        // Edge along x: the four cells around it, ordered in the (y, z) plane.
        if (i < nx - 1 && j > 0 && k > 0 && j < ny - 1 && k < nz - 1) {
          const v1 = values[at(i + 1, j, k)];
          if (v0 < 0 !== v1 < 0)
            quad(cellVertex[cellAt(i, j - 1, k - 1)], cellVertex[cellAt(i, j, k - 1)], cellVertex[cellAt(i, j, k)], cellVertex[cellAt(i, j - 1, k)], v0 >= 0);
        }
        // Edge along y: cells ordered in the (z, x) plane.
        if (j < ny - 1 && i > 0 && k > 0 && i < nx - 1 && k < nz - 1) {
          const v1 = values[at(i, j + 1, k)];
          if (v0 < 0 !== v1 < 0)
            quad(cellVertex[cellAt(i - 1, j, k - 1)], cellVertex[cellAt(i - 1, j, k)], cellVertex[cellAt(i, j, k)], cellVertex[cellAt(i, j, k - 1)], v0 >= 0);
        }
        // Edge along z: cells ordered in the (x, y) plane.
        if (k < nz - 1 && i > 0 && j > 0 && i < nx - 1 && j < ny - 1) {
          const v1 = values[at(i, j, k + 1)];
          if (v0 < 0 !== v1 < 0)
            quad(cellVertex[cellAt(i - 1, j - 1, k)], cellVertex[cellAt(i, j - 1, k)], cellVertex[cellAt(i, j, k)], cellVertex[cellAt(i - 1, j, k)], v0 >= 0);
        }
      }

  // Smooth normals from the gradient, and box projected UVs for the tiling textures.
  const count = positions.length / 3;
  const normals = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  // Wide enough to average out the outline grids, so reflections stay smooth.
  const e = Math.max(step * 0.5, normalSpan);
  for (let v = 0; v < count; v++) {
    const [x, y, z] = [positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]];
    let gx = sdf(x + e, y, z) - sdf(x - e, y, z);
    let gy = sdf(x, y + e, z) - sdf(x, y - e, z);
    let gz = sdf(x, y, z + e) - sdf(x, y, z - e);
    const l = length3(gx, gy, gz) || 1;
    gx /= l;
    gy /= l;
    gz /= l;
    normals.set([gx, gy, gz], v * 3);
    const ax = Math.abs(gx);
    const ay = Math.abs(gy);
    const az = Math.abs(gz);
    const [u, w] = ax >= ay && ax >= az ? [z, y] : ay >= az ? [x, z] : [x, y];
    uvs.set([u * 1.6, w * 1.6], v * 2);
  }

  return { positions: new Float32Array(positions), normals, uvs, indices: new Uint32Array(indices) };
}

/**
 * Sphere traces a ray against the body to find where a control sits, and the
 * surface direction there. Lets controls follow the curved shell.
 */
export function hitBody(origin: V3, direction: V3, sdf = bodyDistance): { position: V3; normal: V3 } | null {
  const l = length3(...direction);
  const d: V3 = [direction[0] / l, direction[1] / l, direction[2] / l];
  let t = 0;
  for (let n = 0; n < 400 && t < 4; n++) {
    const p: V3 = [origin[0] + d[0] * t, origin[1] + d[1] * t, origin[2] + d[2] * t];
    const dist = sdf(...p);
    if (dist < 1e-4) {
      const e = 1e-3;
      const g: V3 = [
        sdf(p[0] + e, p[1], p[2]) - sdf(p[0] - e, p[1], p[2]),
        sdf(p[0], p[1] + e, p[2]) - sdf(p[0], p[1] - e, p[2]),
        sdf(p[0], p[1], p[2] + e) - sdf(p[0], p[1], p[2] - e),
      ];
      const gl = length3(...g) || 1;
      return { position: p, normal: [g[0] / gl, g[1] / gl, g[2] / gl] };
    }
    // The outline hull may overestimate distances by up to sqrt(3) near its edges: step cautiously.
    t += Math.max(dist * 0.55, 1e-4);
  }
  return null;
}

/** Sampling grids of the two meshes, shared by the worker and the fallback. */
const BODY_GRID = { min: [-0.66, -0.5, -0.44] as V3, max: [0.66, 0.52, 0.34] as V3, step: 0.009 };
const FLASH_GRID = { min: [-0.42, 0.34, -0.19] as V3, max: [0.1, 0.52, 0.34] as V3, step: 0.006 };

export interface BodyMeshes {
  /** Indices are ordered shell first, then rubber: `shellIndexCount` splits the two material groups. */
  body: MeshData & { shellIndexCount: number };
  flash: MeshData;
}

/** The whole costly part of the 3D view (about half a second): run it in a worker. */
export function buildBodyMeshes(): BodyMeshes {
  const body = surfaceNets(bodyDistance, BODY_GRID.min, BODY_GRID.max, BODY_GRID.step, 0.012);
  const shell: number[] = [];
  const rubber: number[] = [];
  const p = body.positions;
  for (let t = 0; t < body.indices.length; t += 3) {
    const [a, b, c] = [body.indices[t], body.indices[t + 1], body.indices[t + 2]];
    const cx = (p[a * 3] + p[b * 3] + p[c * 3]) / 3;
    const cy = (p[a * 3 + 1] + p[b * 3 + 1] + p[c * 3 + 1]) / 3;
    const cz = (p[a * 3 + 2] + p[b * 3 + 2] + p[c * 3 + 2]) / 3;
    (isGrip(cx, cy, cz) ? rubber : shell).push(a, b, c);
  }
  return {
    body: { ...body, indices: new Uint32Array([...shell, ...rubber]), shellIndexCount: shell.length },
    flash: surfaceNets(flashDistance, FLASH_GRID.min, FLASH_GRID.max, FLASH_GRID.step, 0.008),
  };
}
