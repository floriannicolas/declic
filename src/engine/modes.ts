import type { Camera, Chapter, ModeId } from "@/types";
import { cameraQuestionsFor } from "./questions";

export interface ModeInfo {
  id: ModeId;
  title: string;
  description: string;
}

export function availableModes(chapter: Chapter, camera: Camera): ModeInfo[] {
  const modes: (ModeInfo & { available: boolean })[] = [
    {
      id: "simulator",
      title: "Simulateur de boîtier",
      description: "Règle vitesse, ouverture et ISO face à une situation réelle.",
      available: chapter.scenarios.length > 0,
    },
    {
      id: "stops",
      title: "Calcul de stops",
      description: "Ouvrir, fermer, compenser : le calcul mental des stops.",
      available: chapter.stops !== undefined,
    },
    {
      id: "vocabulary",
      title: "Vocabulaire",
      description: "Les termes du cours, en QCM et en association.",
      available: chapter.vocabulary.length >= 4 || chapter.questions.length > 0,
    },
    {
      id: "diagnosis",
      title: "Diagnostic de photo ratée",
      description: "Un symptôme, une cause, une correction.",
      available: chapter.diagnoses.length > 0,
    },
    {
      id: "camera",
      title: `Spécial ${camera.model}`,
      description: "Boutons, menus et comportements de ton boîtier.",
      available: cameraQuestionsFor(camera, chapter.id).length > 0,
    },
  ];
  return modes.filter((m) => m.available).map(({ id, title, description }) => ({ id, title, description }));
}
