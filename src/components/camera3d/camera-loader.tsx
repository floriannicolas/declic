"use client";

import type { LoadStage } from "./camera-viewer";

const STAGES: Record<LoadStage, { label: string; progress: number }> = {
  engine: { label: "Chargement du moteur 3D", progress: 0.2 },
  moulding: { label: "Moulage de la coque", progress: 0.55 },
  lighting: { label: "Réglage de l'éclairage du studio", progress: 0.85 },
  ready: { label: "Prêt", progress: 1 },
};

const BLADES = 7;

/**
 * Lens diaphragm opening and closing while the 3D view loads. Animated with CSS
 * transforms only, so it keeps moving even while the main thread is busy.
 */
export function CameraLoader({ stage }: { stage: LoadStage }) {
  const { label, progress } = STAGES[stage];
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-5 text-center">
      <svg viewBox="-60 -60 120 120" className="size-28" aria-hidden>
        <defs>
          <clipPath id="loader-lens">
            <circle r="50" />
          </clipPath>
        </defs>
        <circle r="56" fill="none" stroke="#3a3d44" strokeWidth="5" />
        <circle r="50" fill="#0b0c0f" />
        <g clipPath="url(#loader-lens)">
        <g className="loader-iris">
          {Array.from({ length: BLADES }, (_, i) => (
            <g key={i} transform={`rotate(${(360 / BLADES) * i})`}>
              <path className="loader-blade" d="M 0 -50 A 50 50 0 0 1 43 -25 L 8 -6 Z" fill="var(--surface-2)" stroke="#0b0c0f" strokeWidth="1.2" />
            </g>
          ))}
        </g>
        </g>
        <circle r="7" className="loader-pupil" fill="var(--accent)" />
      </svg>
      <div className="flex w-56 flex-col gap-2">
        <p className="text-fluid-sm font-medium text-text">{label}…</p>
        <div className="h-1 overflow-hidden rounded-full bg-line">
          <div className="h-full origin-left rounded-full bg-accent transition-transform duration-500 ease-out" style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>
    </div>
  );
}
