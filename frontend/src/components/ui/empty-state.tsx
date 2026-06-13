export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-line bg-surface-2 px-4 py-8 text-center text-xs font-bold uppercase tracking-[0.24em] text-fg-muted">
      {children}
    </div>
  );
}
