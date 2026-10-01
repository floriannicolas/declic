"use client";

import { useEffect, useMemo } from "react";
import { MeshPhysicalMaterial, MeshStandardMaterial, Vector2 } from "three";
import { blockGridNormal, brushedRoughness, grainNormal, leatherNormal, ribNormal } from "./textures";

/** Shared materials of the 3D body, created once per viewer and disposed with it. */
export function useMaterials() {
  const materials = useMemo(() => {
    const shell = new MeshPhysicalMaterial({
      color: "#1c1d21",
      roughness: 0.55,
      clearcoat: 0.25,
      clearcoatRoughness: 0.6,
      normalMap: grainNormal(14),
      normalScale: new Vector2(0.35, 0.35),
    });
    const leather = new MeshStandardMaterial({
      color: "#16171a",
      roughness: 0.92,
      normalMap: leatherNormal(7),
      normalScale: new Vector2(0.9, 0.9),
    });
    const rubberRibs = new MeshStandardMaterial({ color: "#121315", roughness: 0.9, normalMap: blockGridNormal(72, 5), normalScale: new Vector2(1.6, 1.6) });
    const fineRibs = new MeshStandardMaterial({ color: "#2b2d33", roughness: 0.55, normalMap: ribNormal(140), normalScale: new Vector2(1, 1) });
    const dialRibs = new MeshStandardMaterial({ color: "#33353b", roughness: 0.5, normalMap: ribNormal(48), normalScale: new Vector2(1.6, 1.6) });
    const plastic = new MeshStandardMaterial({ color: "#2f3137", roughness: 0.45 });
    const button = new MeshPhysicalMaterial({ color: "#3a3d44", roughness: 0.35, clearcoat: 0.5 });
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
      iridescenceThicknessRange: [180, 520],
      envMapIntensity: 2.5,
    });
    const red = new MeshStandardMaterial({ color: "#d3202a", roughness: 0.4 });
    return { shell, leather, rubberRibs, fineRibs, dialRibs, plastic, button, metal, chrome, glassDark, coatedGlass, red };
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
