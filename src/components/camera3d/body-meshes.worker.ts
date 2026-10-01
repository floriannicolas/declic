import { buildBodyMeshes } from "./body-sdf";

/** Meshes the moulded body off the main thread, so page transitions stay smooth. */
self.onmessage = () => {
  const meshes = buildBodyMeshes();
  const buffers = [meshes.body, meshes.flash].flatMap((m) => [m.positions.buffer, m.normals.buffer, m.uvs.buffer, m.indices.buffer]);
  (self as unknown as Worker).postMessage(meshes, buffers);
};
