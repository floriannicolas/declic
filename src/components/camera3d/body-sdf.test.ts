import { describe, expect, it } from "vitest";
import { bodyDistance, flashDistance, fromMm, hitBody, surfaceNets, type MeshData } from "./body-sdf";

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
    const body = surfaceNets(bodyDistance, [-0.66, -0.5, -0.44], [0.66, 0.52, 0.34], 0.014);
    const flash = surfaceNets(flashDistance, [-0.42, 0.34, -0.19], [0.1, 0.52, 0.34], 0.01);
    const elapsed = performance.now() - start;
    expect(faceAgreement(body)).toBeGreaterThan(0.99);
    expect(flash.indices.length).toBeGreaterThan(300);
    expect(elapsed).toBeLessThan(2500);
  });

  it("finds controls on the curved shell", () => {
    // Mode dial deck, and the multi selector on the back (positions measured on the photos).
    const top = hitBody(fromMm(20.5, 120, -39.8), [0, -1, 0]);
    expect(top).not.toBeNull();
    expect(top!.normal[1]).toBeGreaterThan(0.9);
    const back = hitBody(fromMm(26.7, 28, -120), [0, 0, 1]);
    expect(back!.normal[2]).toBeLessThan(-0.9);
    // The back of the body sits about 60 mm behind the mount face.
    expect(back!.position[2]).toBeCloseTo(fromMm(0, 0, -59.5)[2], 1);
  });
});
