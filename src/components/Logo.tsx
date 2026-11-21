export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="14" height="12" rx="2.5" />
          <path d="M16 10l5-3v10l-5-3" />
          <circle cx="9" cy="11" r="2" fill="currentColor" stroke="none" />
        </svg>
      </div>
      <span className={`text-lg font-bold tracking-tight ${light ? "text-white" : "text-ink"}`}>Classroom</span>
    </div>
  );
}
