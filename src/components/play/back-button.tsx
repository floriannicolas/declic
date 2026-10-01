export function BackButton({ onClick, label }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ? undefined : "Retour"}
      className="-ml-2 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 self-start rounded-full px-2 text-fluid-sm text-muted transition-colors hover:text-text"
    >
      <span aria-hidden className="text-lg leading-none">
        ←
      </span>
      {label}
    </button>
  );
}
