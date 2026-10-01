import { Game } from "@/components/game/game";
import { cameras } from "@/data/cameras";
import { chapters } from "@/data/chapters";
import { validateContent } from "@/data/schemas";
import { availableModes } from "@/engine/modes";

export const dynamicParams = false;

/** Every chapter and mode is prerendered. Content is validated here, so broken data fails the build. */
export function generateStaticParams() {
  validateContent(chapters, cameras);
  const modePaths = new Map<string, string[]>();
  for (const camera of cameras)
    for (const chapter of chapters)
      for (const mode of availableModes(chapter, camera)) modePaths.set(`${chapter.id}/${mode.id}`, [chapter.id, mode.id]);

  return [{ path: [] }, ...chapters.map((c) => ({ path: [c.id] })), ...[...modePaths.values()].map((path) => ({ path }))];
}

export default function Page() {
  return <Game />;
}
