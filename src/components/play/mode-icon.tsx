import type { ModeId } from "@/types";

const PATHS: Record<ModeId, React.ReactNode> = {
  simulator: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v3M12 12l3-3" />
    </>
  ),
  stops: (
    <>
      <path d="M4 18h16M6 18v-4M10 18v-7M14 18v-10M18 18V5" />
    </>
  ),
  vocabulary: (
    <>
      <path d="M5 5h9a3 3 0 0 1 3 3v11H8a3 3 0 0 1-3-3z" />
      <path d="M9 9h5M9 13h4" />
    </>
  ),
  diagnosis: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.5-4.5M9 11h4M11 9v4" />
    </>
  ),
  camera: (
    <>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <circle cx="12" cy="13" r="3.5" />
      <path d="M8 7l1.5-2.5h5L16 7" />
    </>
  ),
};

export function ModeIcon({ mode, className }: { mode: ModeId; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {PATHS[mode]}
    </svg>
  );
}
