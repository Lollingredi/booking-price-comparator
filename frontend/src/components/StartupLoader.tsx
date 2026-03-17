interface StartupLoaderProps {
  steps: string[];                    // all planned steps (labels)
  currentIndex: number;               // index of the active step (>= steps.length = done)
  stepDetails?: (string | null)[];    // optional per-step subtitle (slug, warning, error)
}

/**
 * Full-page loading overlay shown while searching Booking.com slugs and scraping prices.
 * Mounts as a fixed overlay so it never affects the underlying page layout.
 */
export default function StartupLoader({ steps, currentIndex, stepDetails }: StartupLoaderProps) {
  const done = currentIndex >= steps.length;

  function detailColor(detail: string): string {
    if (detail.startsWith("✗")) return "#EF4444";   // red
    if (detail.startsWith("⚠")) return "#F59E0B";   // amber
    if (detail.startsWith("slug:")) return "#9CA3AF"; // gray
    return "#10B981"; // green (prices found etc.)
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center gap-8 px-6">
      {/* Logo */}
      <div className="text-2xl font-bold text-teal-600 tracking-tight select-none">RateScope</div>

      {/* Spinner or checkmark */}
      <div className="relative w-14 h-14 flex items-center justify-center">
        {done ? (
          <div className="w-14 h-14 rounded-full bg-teal-50 border-2 border-teal-400 flex items-center justify-center">
            <span className="text-teal-500 text-2xl font-bold">✓</span>
          </div>
        ) : (
          <div className="w-14 h-14 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
        )}
      </div>

      {/* Steps list */}
      <div className="w-full max-w-sm space-y-2">
        {steps.map((label, i) => {
          const isActive = i === currentIndex;
          const isDone   = i < currentIndex;
          const detail   = stepDetails?.[i] ?? null;

          return (
            <div key={i} className="flex items-start gap-2.5">
              {/* Circle indicator */}
              <span
                className="w-5 h-5 shrink-0 flex items-center justify-center rounded-full border-2 text-[10px] font-bold mt-0.5"
                style={{
                  borderColor: isActive ? "#0D9488" : isDone ? "#D1D5DB" : "#E5E7EB",
                  background:  isActive ? "#F0FDFA"  : isDone ? "#F3F4F6" : "white",
                  color:       isActive ? "#0D9488"  : isDone ? "#9CA3AF" : "#D1D5DB",
                }}
              >
                {isDone ? "✓" : i + 1}
              </span>

              {/* Label + detail */}
              <div className="flex-1 min-w-0">
                <div className={`flex items-center gap-2 text-sm ${
                  isActive ? "text-teal-700 font-semibold" :
                  isDone   ? "text-gray-400" :
                             "text-gray-300"
                }`}>
                  <span className={isDone ? "line-through" : ""}>{label}</span>
                  {isActive && (
                    <span className="ml-auto text-[10px] text-teal-400 animate-pulse shrink-0">
                      in corso…
                    </span>
                  )}
                </div>

                {/* Per-step detail (slug, warning, error) — shown once the step is active or done */}
                {detail && (isDone || isActive) && (
                  <div
                    className="text-[10px] mt-0.5 font-mono truncate"
                    style={{ color: detailColor(detail) }}
                  >
                    {detail}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {done && (
          <div className="flex items-center gap-2.5 text-sm text-teal-600 font-semibold pt-1">
            <span className="w-5 h-5 shrink-0 flex items-center justify-center rounded-full bg-teal-500 text-white text-[10px] font-bold">✓</span>
            Tutto pronto!
          </div>
        )}
      </div>
    </div>
  );
}
