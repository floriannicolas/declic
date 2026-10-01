"use client";

import { AnimatePresence, MotionConfig, motion, type Variants } from "motion/react";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { findChapter } from "@/data/chapters";
import { availableModes } from "@/engine/modes";
import { useCamera } from "@/progress/use-progress";
import type { Camera } from "@/types";
import { ChapterScreen } from "../menu/chapter-screen";
import { HomeScreen } from "../menu/home-screen";
import { ModeScreen } from "../play/mode-screen";
import { DURATION, EASE_OUT } from "../motion-tokens";
import { parseRoute, routeDepth, routePath, type Route } from "./routes";

interface Navigation {
  key: string;
  depth: number;
  /** 1 forward, -1 back. */
  direction: number;
  /** Chapter to mode and back: the mode card grows into the screen instead of sliding. */
  morph: boolean;
}

type Custom = Pick<Navigation, "direction" | "morph">;

const screen: Variants = {
  enter: ({ direction, morph }: Custom) => ({ opacity: 0, x: morph || direction === 0 ? 0 : `${direction * 24}%` }),
  center: { opacity: 1, x: 0, transition: { duration: DURATION.screen, ease: EASE_OUT } },
  exit: ({ direction, morph }: Custom) => ({
    opacity: 0,
    x: morph ? 0 : `${direction * -24}%`,
    transition: { duration: DURATION.screen * 0.8, ease: EASE_OUT },
  }),
};

/**
 * Navigation uses the native history API: Next keeps usePathname in sync, the
 * tree stays mounted, and AnimatePresence can play exits and shared layouts.
 */
export function Game() {
  const { camera } = useCamera();
  const route = resolve(parseRoute(usePathname()), camera);
  const key = routePath(route);
  const depth = routeDepth(route);

  const [nav, setNav] = useState<Navigation>({ key, depth, direction: 0, morph: false });
  if (nav.key !== key) {
    setNav({ key, depth, direction: Math.sign(depth - nav.depth), morph: Math.min(depth, nav.depth) === 1 && Math.max(depth, nav.depth) === 2 });
  }

  const navigate = useCallback((next: Route) => {
    window.history.pushState(null, "", routePath(next));
    window.scrollTo({ top: 0 });
  }, []);

  const custom: Custom = { direction: nav.direction, morph: nav.morph };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-dvh overflow-x-clip">
        <AnimatePresence mode="popLayout" initial={false} custom={custom}>
          <motion.div
            key={key}
            custom={custom}
            variants={screen}
            initial="enter"
            animate="center"
            exit="exit"
            className="min-h-dvh w-full"
          >
            {route.screen === "home" && <HomeScreen onOpen={(chapterId) => navigate({ screen: "chapter", chapterId })} />}
            {route.screen === "chapter" && (
              <ChapterScreen
                chapter={findChapter(route.chapterId)!}
                camera={camera}
                onBack={() => navigate({ screen: "home" })}
                onPlay={(mode) => navigate({ screen: "mode", chapterId: route.chapterId, mode })}
              />
            )}
            {route.screen === "mode" && (
              <ModeScreen
                chapter={findChapter(route.chapterId)!}
                camera={camera}
                mode={route.mode}
                onBack={() => navigate({ screen: "chapter", chapterId: route.chapterId })}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

/** Falls back to the closest valid screen if a URL points to missing content. */
function resolve(route: Route, camera: Camera): Route {
  if (route.screen === "home") return route;
  const chapter = findChapter(route.chapterId);
  if (!chapter) return { screen: "home" };
  if (route.screen === "mode" && !availableModes(chapter, camera).some((m) => m.id === route.mode))
    return { screen: "chapter", chapterId: chapter.id };
  return route;
}
