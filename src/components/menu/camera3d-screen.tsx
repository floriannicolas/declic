"use client";

import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { chapters } from "@/data/chapters";
import type { Camera, Term } from "@/types";
import { BackButton } from "../play/back-button";
import { useIsClient } from "../play/use-is-client";
import { DURATION, EASE_OUT, micro } from "../motion-tokens";

const CameraViewer = dynamic(() => import("../camera3d/camera-viewer"), {
  ssr: false,
  loading: () => <ViewerPlaceholder label="Chargement du modèle 3D…" />,
});

function ViewerPlaceholder({ label }: { label: string }) {
  return <div className="grid size-full place-items-center text-fluid-sm text-muted">{label}</div>;
}

const allTerms: Term[] = chapters.flatMap((c) => c.vocabulary);

export function Camera3dScreen({ camera, onBack }: { camera: Camera; onBack: () => void }) {
  // With a scanned model, only the controls placed on it are listed.
  const parts = (camera.parts ?? []).filter((p) => !camera.model3d || camera.model3d.spots[p.anchor]);
  const pick = process.env.NODE_ENV === "development" && typeof window !== "undefined" && window.location.search.includes("pick");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exploded, setExploded] = useState(false);
  const isClient = useIsClient();
  const index = parts.findIndex((p) => p.id === selectedId);
  const part = index >= 0 ? parts[index] : null;
  const terms = (part?.terms ?? []).map((id) => allTerms.find((t) => t.id === id)).filter((t): t is Term => !!t);
  const go = (delta: number) => setSelectedId(parts[(index + delta + parts.length) % parts.length].id);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-[max(1rem,var(--safe-left))] pt-[calc(var(--safe-top)+1rem)] pb-[calc(var(--safe-bottom)+2rem)]">
      <BackButton onClick={onBack} label="Accueil" />
      <header className="flex flex-col gap-1">
        <p className="text-fluid-xs font-medium uppercase tracking-[0.2em] text-accent">Découvrir son boîtier</p>
        <h1 className="text-fluid-xl font-semibold leading-tight">
          {camera.brand} {camera.model} en 3D
        </h1>
        <p className="text-fluid-sm text-muted">Fais tourner l&apos;appareil, puis touche une pastille pour découvrir la commande.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] landscape-phone:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="relative h-[52dvh] min-h-72 overflow-hidden rounded-2xl border border-line lg:h-[68dvh] landscape-phone:h-[78dvh]">
          {isClient ? <CameraViewer parts={parts} selectedId={selectedId} onSelect={setSelectedId} exploded={exploded} model={camera.model3d} pick={pick} /> : <ViewerPlaceholder label="Modèle 3D" />}
          <div className="absolute top-3 right-3 flex gap-2">
            {!camera.model3d && (
              <button
                type="button"
                onClick={() => {
                  setExploded((e) => !e);
                  setSelectedId(null);
                }}
                aria-pressed={exploded}
                className={`min-h-11 rounded-full px-4 text-fluid-xs font-medium backdrop-blur-sm transition-colors ${
                  exploded ? "bg-accent text-accent-ink" : "bg-black/60 text-text"
                }`}
              >
                {exploded ? "Rassembler" : "Vue éclatée"}
              </button>
            )}
            {selectedId && (
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="min-h-11 rounded-full bg-black/60 px-4 text-fluid-xs font-medium text-text backdrop-blur-sm"
              >
                Vue d&apos;ensemble
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {camera.model3d && (
            <p className="text-fluid-xs leading-relaxed text-muted">
              {camera.model3d.label} Modèle 3D :{" "}
              <a href={camera.model3d.credit.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-text">
                {camera.model3d.credit.author}
              </a>
              ,{" "}
              <a href={camera.model3d.credit.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-text">
                {camera.model3d.credit.license}
              </a>
              . {camera.model3d.credit.changes}
            </p>
          )}
          <AnimatePresence mode="wait" initial={false}>
            {part ? (
              <motion.section
                key={part.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: DURATION.short, ease: EASE_OUT }}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4"
                aria-live="polite"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-fluid-lg font-semibold">
                    <span className="tabular mr-2 text-accent">{index + 1}.</span>
                    {part.name}
                  </h2>
                  <div className="flex shrink-0 gap-1">
                    <NavButton label="Commande précédente" onClick={() => go(-1)}>←</NavButton>
                    <NavButton label="Commande suivante" onClick={() => go(1)}>→</NavButton>
                  </div>
                </div>
                <p className="text-fluid-base leading-relaxed">{part.role}</p>
                {part.tip && (
                  <p className="rounded-xl bg-accent-soft p-3 text-fluid-sm leading-relaxed">
                    <span className="font-semibold text-accent">Astuce : </span>
                    {part.tip}
                  </p>
                )}
                {terms.length > 0 && (
                  <dl className="flex flex-col gap-2">
                    {terms.map((t) => (
                      <div key={t.id} className="rounded-xl bg-surface-2 p-3 text-fluid-sm leading-relaxed">
                        <dt className="font-semibold">{t.term}</dt>
                        <dd className="text-text/85">{t.definition}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </motion.section>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={micro}
                className="rounded-2xl border border-dashed border-line p-4 text-fluid-sm text-muted"
              >
                {parts.length} commandes à découvrir. Glisse pour tourner l&apos;appareil, pince ou utilise la molette pour zoomer.
              </motion.p>
            )}
          </AnimatePresence>

          <ul className="flex flex-wrap gap-2" aria-label="Toutes les commandes">
            {parts.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
                  aria-pressed={p.id === selectedId}
                  className={`tabular min-h-11 rounded-full border px-3 text-fluid-xs font-medium transition-colors duration-200 ${
                    p.id === selectedId ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface-2 text-text hover:border-accent/60"
                  }`}
                >
                  {i + 1}. {p.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}

function NavButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="grid size-11 place-items-center rounded-full border border-line bg-surface-2 text-text">
      {children}
    </button>
  );
}
