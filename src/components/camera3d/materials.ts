"use client";

import { useEffect, useMemo } from "react";
import { DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, Vector2 } from "three";
import { blockGridNormal, brushedRoughness, grainNormal, leatherNormal, ribNormal, spunRoughness } from "./textures";

/** Shared materials of the 3D body, created once per viewer and disposed with it. */
export function useMaterials() {
  const materials = useMemo(() => {
    // Deep black polycarbonate with a fine stippled finish, as on the real body.
    const shell = new MeshPhysicalMaterial({
      color: "#121316",
      roughness: 0.6,
      clearcoat: 0.12,
      clearcoatRoughness: 0.55,
      normalMap: grainNormal(26),
      normalScale: new Vector2(0.45, 0.45),
    });
    // Pebbled rubber covering of the grip and thumb rest.
    const leather = new MeshStandardMaterial({
      color: "#0e0f11",
      roughness: 0.88,
      normalMap: leatherNormal(9),
      normalScale: new Vector2(1.6, 1.6),
    });
    const rubber = new MeshStandardMaterial({ color: "#0f1012", roughness: 0.85, normalMap: grainNormal(40), normalScale: new Vector2(0.3, 0.3) });
    const spun = new MeshStandardMaterial({ color: "#16171a", metalness: 0.35, roughness: 0.32, roughnessMap: spunRoughness() });
    const rubberRibs = new MeshStandardMaterial({ color: "#121315", roughness: 0.9, normalMap: blockGridNormal(72, 5), normalScale: new Vector2(1.6, 1.6) });
    const fineRibs = new MeshStandardMaterial({ color: "#2b2d33", roughness: 0.55, normalMap: ribNormal(140), normalScale: new Vector2(1, 1) });
    const dialRibs = new MeshStandardMaterial({ color: "#1e2024", roughness: 0.5, normalMap: ribNormal(48), normalScale: new Vector2(1.6, 1.6) });
    const plastic = new MeshStandardMaterial({ color: "#1f2125", roughness: 0.5 });
    const button = new MeshPhysicalMaterial({ color: "#1d1f23", roughness: 0.4, clearcoat: 0.4 });
    const metal = new MeshStandardMaterial({ color: "#a7abb3", metalness: 1, roughness: 0.32, roughnessMap: brushedRoughness() });
    const chrome = new MeshStandardMaterial({ color: "#d9dce2", metalness: 1, roughness: 0.15 });
    const glassDark = new MeshPhysicalMaterial({ color: "#05070c", roughness: 0.04, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.02 });
    const coatedGlass = new MeshPhysicalMaterial({
      color: "#06101d",
      roughness: 0.02,
      metalness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0,
      iridescence: 0.7,
      iridescenceIOR: 1.7,
      iridescenceThicknessRange: [250, 420],
      envMapIntensity: 2.5,
    });
    const innerGlass = new MeshPhysicalMaterial({
      color: "#1a1206",
      roughness: 0.05,
      metalness: 0.4,
      clearcoat: 1,
      iridescence: 1,
      iridescenceIOR: 1.9,
      iridescenceThicknessRange: [420, 640],
      envMapIntensity: 1.4,
    });
    // Double sided: the stripe is a thin ribbon laid on the shell.
    const red = new MeshStandardMaterial({ color: "#d8321f", roughness: 0.45, side: DoubleSide });
    return { innerGlass, shell, leather, rubber, spun, rubberRibs, fineRibs, dialRibs, plastic, button, metal, chrome, glassDark, coatedGlass, red };
  }, []);

  useEffect(
    () => () => {
      for (const m of Object.values(materials)) {
        m.normalMap?.dispose();
        m.roughnessMap?.dispose();
        m.dispose();
      }
    },
    [materials],
  );

  return materials;
}

export type Materials = ReturnType<typeof useMaterials>;
