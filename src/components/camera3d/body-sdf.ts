/**
 * The D3500 body as a signed distance field: rounded volumes merged with smooth
 * unions, so the grip flows into the shell like a moulded part. A surface nets
 * pass turns the field into one smooth mesh. Pure math, no three.js import.
 *
 * Coordinates are the photographer's: x to the right (grip side), y up,
 * z forward, in decimetres.
 */

export type V3 = [number, number, number];

const clamp = (x: number, a: number, b: number) => Math.min(Math.max(x, a), b);
const length3 = (x: number, y: number, z: number) => Math.sqrt(x * x + y * y + z * z);

/** Polynomial smooth minimum: blends two shapes over a band of width k. */
export function smin(a: number, b: number, k: number) {
  const h = clamp(0.5 + (0.5 * (b - a)) / k, 0, 1);
  return b * (1 - h) + a * h - k * h * (1 - h);
}
const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);

function roundBox(px: number, py: number, pz: number, c: V3, h: V3, r: number) {
  const qx = Math.abs(px - c[0]) - h[0] + r;
  const qy = Math.abs(py - c[1]) - h[1] + r;
  const qz = Math.abs(pz - c[2]) - h[2] + r;
  return length3(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, Math.max(qy, qz)), 0) - r;
}

/** Signed distance to a plane through `at` with unit normal `n`: positive on the normal side. */
function plane(px: number, py: number, pz: number, n: V3, at: V3) {
  const l = length3(...n);
  return ((px - at[0]) * n[0] + (py - at[1]) * n[1] + (pz - at[2]) * n[2]) / l;
}

/** Cylinder of finite length along z. */
function cylinderZ(px: number, py: number, pz: number, cx: number, cy: number, r: number, z0: number, z1: number) {
  const d = Math.hypot(px - cx, py - cy) - r;
  const h = Math.abs(pz - (z0 + z1) / 2) - (z1 - z0) / 2;
  return Math.min(Math.max(d, h), 0) + length3(Math.max(d, 0), Math.max(h, 0), 0);
}

function gripField(x: number, y: number, z: number) {
  // Only the front bulge: the back of that side belongs to the flat shell.
  let g = roundBox(x, y, z, [0.465, -0.09, 0.15], [0.155, 0.375, 0.255], 0.14);
  // The top slopes towards the front, where the shutter release sits.
  g = smax(g, plane(x, y, z, [0, 1, 0.3], [0.46, 0.28, 0.05]), 0.05);
  // Finger channel between the grip and the lens.
  g = smax(g, -(Math.hypot(x - 0.3, z - 0.47) - 0.1), 0.06);
  return g;
}

function prismField(x: number, y: number, z: number) {
  // Slightly narrower towards the top.
  const taper = 1 - 0.1 * clamp((y - 0.25) / 0.25, 0, 1);
  const sx = (x + 0.08) / taper - 0.08;
  let p = roundBox(sx, y, z, [-0.08, 0.34, -0.06], [0.215, 0.13, 0.2], 0.05);
  // Front face leaning back under the flash hood: this is where the logo plate sits.
  p = smax(p, plane(sx, y, z, [0, 0.35, 1], [0, 0.32, 0.12]), 0.03);
  p = smax(p, plane(sx, y, z, [0, 0.28, -1], [0, 0.4, -0.25]), 0.03);
  return p;
}

/**
 * Flash hood: the long, flat topped housing that juts forward over the lens,
 * overhanging the prism front. Its front face carries the flash window.
 */
function hoodField(x: number, y: number, z: number) {
  let h = roundBox(x, y, z, [-0.08, 0.435, 0.05], [0.205, 0.06, 0.195], 0.055);
  // Top sloping down towards the front, with a soft front edge.
  h = smax(h, plane(x, y, z, [0, 1, 0.3], [0, 0.485, 0.03]), 0.05);
  // Front face leaning back a little.
  h = smax(h, plane(x, y, z, [0, -0.25, 1], [0, 0.43, 0.225]), 0.02);
  return h;
}

/**
 * Region of the prism that pops up as the built in flash: everything in front
 * of a line just ahead of the hot shoe and above a parting line that follows
 * the slope of the front face. Negative inside.
 */
function flashRegion(x: number, y: number, z: number) {
  const behind = -(z + 0.075);
  // Parting line along the underside of the hood.
  const above = -plane(x, y, z, [0, 1, 0.12], [0, 0.39, 0.1]);
  return smax(behind, above, 0.02);
}

/** Width of the parting line around the flash. */
const FLASH_GAP = 0.0025;

function shellField(x: number, y: number, z: number) {
  // Full width shell: the back is one flat surface across the body.
  let body = roundBox(x, y, z, [-0.005, -0.095, -0.055], [0.605, 0.365, 0.245], 0.085);
  // Left shoulder sloping down, as on the real body.
  body = smax(body, plane(x, y, z, [-0.32, 1, 0], [-0.28, 0.27, 0]), 0.07);
  // Raised shoulder carrying the mode dial.
  body = smin(body, roundBox(x, y, z, [0.23, 0.265, -0.08], [0.13, 0.035, 0.135], 0.05), 0.04);
  // Thumb rest at the back.
  body = smin(body, roundBox(x, y, z, [0.48, 0.2, -0.29], [0.1, 0.07, 0.022], 0.02), 0.03);
  // Lens mount flange.
  body = smin(body, cylinderZ(x, y, z, -0.08, -0.06, 0.33, 0.15, 0.215), 0.02);
  return { body, grip: gripField(x, y, z) };
}

/** The whole moulded body, flash included. */
function solidDistance(x: number, y: number, z: number) {
  const { body, grip } = shellField(x, y, z);
  const withPrism = smin(smin(body, grip, 0.06), prismField(x, y, z), 0.045);
  // Small blend only: the hood keeps a crisp overhang above the logo plate.
  return smin(withPrism, hoodField(x, y, z), 0.015);
}

/** Whole body except the pop up flash, with a fine parting line around it. */
export function bodyDistance(x: number, y: number, z: number) {
  return Math.max(solidDistance(x, y, z), FLASH_GAP - flashRegion(x, y, z));
}

/** The pop up flash, cut from the same field so it sits flush when closed. */
export function flashDistance(x: number, y: number, z: number) {
  return Math.max(solidDistance(x, y, z), flashRegion(x, y, z) + FLASH_GAP);
}

/** True where the rubber covering applies: the grip, not the shell. */
export function isGrip(x: number, y: number, z: number) {
  const { body, grip } = shellField(x, y, z);
  return grip < body - 0.01 && z > -0.24;
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
export function surfaceNets(sdf: (x: number, y: number, z: number) => number, min: V3, max: V3, step: number): MeshData {
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
  const e = step * 0.5;
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
  for (let n = 0; n < 200 && t < 4; n++) {
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
    t += Math.max(dist * 0.9, 1e-4);
  }
  return null;
}

/** Sampling grids of the two meshes, shared by the worker and the fallback. */
const BODY_GRID = { min: [-0.72, -0.58, -0.42] as V3, max: [0.76, 0.58, 0.52] as V3, step: 0.012 };
const FLASH_GRID = { min: [-0.4, 0.3, -0.12] as V3, max: [0.25, 0.55, 0.3] as V3, step: 0.008 };

export interface BodyMeshes {
  /** Indices are ordered shell first, then rubber: `shellIndexCount` splits the two material groups. */
  body: MeshData & { shellIndexCount: number };
  flash: MeshData;
}

/** The whole costly part of the 3D view (about half a second): run it in a worker. */
export function buildBodyMeshes(): BodyMeshes {
  const body = surfaceNets(bodyDistance, BODY_GRID.min, BODY_GRID.max, BODY_GRID.step);
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
    flash: surfaceNets(flashDistance, FLASH_GRID.min, FLASH_GRID.max, FLASH_GRID.step),
  };
}
