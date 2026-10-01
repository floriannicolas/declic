import { Game } from "@/components/game/game";
import { CAMERA_3D, GLOSSARY } from "@/components/game/routes";
import { cameras } from "@/data/cameras";
import { chapters } from "@/data/chapters";
import { validateContent } from "@/data/schemas";
import { availableModes } from "@/engine/modes";

export const dynamicParams = false;

/** Every chapter and mode is prerendered. Content is validated here, so broken data fails the build. */
export function generateStaticParams() {
  validateContent(chapters, cameras);
  if (chapters.some((c) => c.id === CAMERA_3D)) throw new Error(`« ${CAMERA_3D} » est réservé, choisis un autre identifiant de chapitre.`);
  const modePaths = new Map<string, string[]>();
  for (const camera of cameras)
    for (const chapter of chapters)
      for (const mode of availableModes(chapter, camera)) modePaths.set(`${chapter.id}/${mode.id}`, [chapter.id, mode.id]);

  return [
    { path: [] },
    ...(cameras.some((c) => c.parts?.length) ? [{ path: [CAMERA_3D] }] : []),
    ...chapters.map((c) => ({ path: [c.id] })),
    ...chapters.filter((c) => c.vocabulary.length > 0).map((c) => ({ path: [c.id, GLOSSARY] })),
    ...[...modePaths.values()].map((path) => ({ path })),
  ];
}

export default function Page() {
  return <Game />;
}
