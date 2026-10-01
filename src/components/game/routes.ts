import type { ModeId } from "@/types";

export type Route =
  | { screen: "home" }
  | { screen: "camera3d" }
  | { screen: "chapter"; chapterId: string }
  | { screen: "glossary"; chapterId: string }
  | { screen: "mode"; chapterId: string; mode: ModeId };

export function parseRoute(pathname: string): Route {
  const [chapterId, mode] = pathname.split("/").filter(Boolean);
  if (chapterId === CAMERA_3D && !mode) return { screen: "camera3d" };
  if (chapterId && mode === GLOSSARY) return { screen: "glossary", chapterId };
  if (chapterId && mode) return { screen: "mode", chapterId, mode: mode as ModeId };
  if (chapterId) return { screen: "chapter", chapterId };
  return { screen: "home" };
}

export function routePath(route: Route): string {
  if (route.screen === "mode") return `/${route.chapterId}/${route.mode}`;
  if (route.screen === "camera3d") return `/${CAMERA_3D}`;
  if (route.screen === "chapter") return `/${route.chapterId}`;
  if (route.screen === "glossary") return `/${route.chapterId}/${GLOSSARY}`;
  return "/";
}

export const GLOSSARY = "glossary";
export const CAMERA_3D = "camera-3d";

export const routeDepth = (route: Route) => ({ home: 0, camera3d: 1, chapter: 1, mode: 2, glossary: 2 })[route.screen];

export const routeKey = routePath;
