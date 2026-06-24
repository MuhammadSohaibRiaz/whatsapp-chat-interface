export function LoadingSkeleton() {
  return (
    <div className="flex h-full min-h-[55vh] flex-col rounded-3xl border border-[color:var(--line)] bg-white/85 p-6 shadow-[0_20px_70px_-40px_rgba(20,36,60,0.45)] backdrop-blur sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-6 w-52 rounded-full bg-[color:var(--surface-muted)] skeleton-shimmer" />
        <div className="h-8 w-24 rounded-full bg-[color:var(--surface-muted)] skeleton-shimmer" />
      </div>
      <div className="grid flex-1 gap-6 md:grid-cols-[320px,1fr]">
        <div className="space-y-3 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-[color:var(--line)] bg-white/75 p-3"
            >
              <div className="mb-2 h-4 w-3/5 rounded-full bg-[color:var(--surface-muted)] skeleton-shimmer" />
              <div className="h-3 w-4/5 rounded-full bg-[color:var(--surface-muted)] skeleton-shimmer" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className={`h-12 rounded-2xl bg-[color:var(--surface-muted)] skeleton-shimmer ${
                  index % 2 === 0 ? "w-2/3" : "ml-auto w-1/2"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
