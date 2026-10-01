import { describe, expect, it } from "vitest";
import { bodyDistance, flashDistance, hitBody, surfaceNets, type MeshData } from "./body-sdf";

function faceAgreement(mesh: MeshData) {
  const p = mesh.positions;
  const n = mesh.normals;
  let agree = 0;
  for (let t = 0; t < mesh.indices.length; t += 3) {
    const [a, b, c] = [mesh.indices[t] * 3, mesh.indices[t + 1] * 3, mesh.indices[t + 2] * 3];
    const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2];
    const vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
    const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
    if (fx * n[a] + fy * n[a + 1] + fz * n[a + 2] > 0) agree++;
  }
  return agree / (mesh.indices.length / 3);
}

describe("surface nets", () => {
  it("meshes a sphere with outward facing triangles", () => {
    const mesh = surfaceNets((x, y, z) => Math.hypot(x, y, z) - 0.5, [-0.7, -0.7, -0.7], [0.7, 0.7, 0.7], 0.05);
    expect(mesh.indices.length).toBeGreaterThan(1000);
    expect(faceAgreement(mesh)).toBeGreaterThan(0.99);
    for (let v = 0; v < mesh.positions.length; v += 3) expect(Math.hypot(mesh.positions[v], mesh.positions[v + 1], mesh.positions[v + 2])).toBeCloseTo(0.5, 1);
  });

  it("meshes the D3500 body quickly and consistently", () => {
    const start = performance.now();
    const body = surfaceNets(bodyDistance, [-0.72, -0.58, -0.42], [0.76, 0.58, 0.52], 0.014);
    const flash = surfaceNets(flashDistance, [-0.4, 0.3, -0.15], [0.25, 0.55, 0.25], 0.012);
    const elapsed = performance.now() - start;
    expect(faceAgreement(body)).toBeGreaterThan(0.99);
    expect(flash.indices.length).toBeGreaterThan(300);
    expect(elapsed).toBeLessThan(2500);
  });

  it("finds controls on the curved shell", () => {
    const top = hitBody([0.23, 1, -0.08], [0, -1, 0]);
    expect(top).not.toBeNull();
    expect(top!.normal[1]).toBeGreaterThan(0.9);
    const back = hitBody([0.41, -0.04, -1], [0, 0, 1]);
    expect(back!.normal[2]).toBeLessThan(-0.9);
  });
});
