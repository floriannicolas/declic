import type { ModeId } from "@/types";

export type Route =
  | { screen: "home" }
  | { screen: "chapter"; chapterId: string }
  | { screen: "mode"; chapterId: string; mode: ModeId };

export function parseRoute(pathname: string): Route {
  const [chapterId, mode] = pathname.split("/").filter(Boolean);
  if (chapterId && mode) return { screen: "mode", chapterId, mode: mode as ModeId };
  if (chapterId) return { screen: "chapter", chapterId };
  return { screen: "home" };
}

export function routePath(route: Route): string {
  if (route.screen === "mode") return `/${route.chapterId}/${route.mode}`;
  if (route.screen === "chapter") return `/${route.chapterId}`;
  return "/";
}

export const routeDepth = (route: Route) => ({ home: 0, chapter: 1, mode: 2 })[route.screen];

export const routeKey = routePath;
