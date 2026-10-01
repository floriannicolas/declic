"use client";

import { useSyncExternalStore } from "react";
import { cameras, findCamera } from "@/data/cameras";
import type { Camera, ModeId } from "@/types";
import { createProgressStore, localRepository, recordKey, type ModeRecord } from "./store";

const store = createProgressStore(localRepository);

const NO_RECORD: ModeRecord = { bestScore: 0, bestStreak: 0 };

export function useProgress() {
  const data = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return {
    record: (chapterId: string, mode: ModeId): ModeRecord => data.records[recordKey(chapterId, mode)] ?? NO_RECORD,
    submit: store.submit,
  };
}

/** With a single profile, it is used directly and no choice is ever stored. */
export function useCamera(): { camera: Camera; cameras: readonly Camera[]; select: (id: string) => void } {
  const data = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return { camera: findCamera(cameras.length > 1 ? data.cameraId : null), cameras, select: store.selectCamera };
}
