export function AppContentLoading() {
  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <div className="h-28 rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_24px_80px_var(--app-shadow)]" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <div className="h-56 rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)]" />
          <div className="h-56 rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface-soft)]" />
        </div>
        <div className="h-80 rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)]" />
      </div>
    </div>
  );
}
