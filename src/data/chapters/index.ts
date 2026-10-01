import type { Chapter } from "@/types";
import { chapter1 } from "./chapter-1";

/** Register new chapters here: the menu lists them in this order. */
export const chapters: readonly Chapter[] = [chapter1];

export function findChapter(id: string | null | undefined): Chapter | undefined {
  return chapters.find((c) => c.id === id);
}
