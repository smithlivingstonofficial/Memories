export function AppContentLoading() {
  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <SkeletonBlock className="h-28 shadow-[0_24px_80px_var(--app-shadow)]" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <SkeletonBlock className="h-56" />
          <SkeletonBlock className="h-56" />
        </div>
        <SkeletonBlock className="h-80" />
      </div>
    </div>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] ${className}`}
    >
      <div className="absolute inset-0 animate-pulse bg-[var(--app-surface-soft)] opacity-70" />
      <div className="absolute inset-y-0 -left-1/2 w-1/2 animate-[mem-shimmer_1.45s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}
