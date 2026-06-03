export function RouteLoadingShell() {
  return (
    <div className="mem-bg flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-5xl space-y-5">
        <div className="h-24 rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_24px_80px_var(--app-shadow)]" />
        <div className="grid gap-5 md:grid-cols-[260px_1fr]">
          <div className="h-80 rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)]" />
          <div className="space-y-4">
            <div className="h-40 rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)]" />
            <div className="h-40 rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
