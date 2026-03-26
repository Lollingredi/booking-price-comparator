import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { CalendarDay } from "../types";

interface Props {
  data: CalendarDay[];
  isLoading: boolean;
}

/** Get color class based on rank/price positioning. */
function getCellColor(day: CalendarDay): string {
  if (day.own_min == null) return "bg-gray-100 dark:bg-slate-700/50 text-gray-400 dark:text-slate-500";
  if (day.rank === 1) return "bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300";
  if (day.rank != null && day.rank <= 2) return "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300";
  return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
}

function getDayLabel(day: CalendarDay): string {
  if (day.own_min == null) return "—";
  return `€${Math.round(day.own_min)}`;
}

export default function CalendarHeatmap({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-[14px] border border-gray-200 dark:border-slate-700 p-6">
        <div className="text-center py-8 text-gray-400 dark:text-slate-500">Caricamento calendario...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-[14px] border border-gray-200 dark:border-slate-700 p-6">
        <div className="text-center py-8 text-gray-400 dark:text-slate-500">
          <svg className="mx-auto mb-3 w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.5" />
            <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Nessun dato disponibile. Avvia una scansione prezzi per popolare il calendario.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[14px] border border-gray-200 dark:border-slate-700 p-4">
      <div className="grid grid-cols-7 gap-1.5">
        {/* Day-of-week headers */}
        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-gray-400 dark:text-slate-500 pb-1">
            {d}
          </div>
        ))}

        {/* Leading empty cells to align first date to correct day of week */}
        {data.length > 0 &&
          Array.from({ length: (parseISO(data[0].check_in).getDay() + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

        {/* Calendar cells */}
        {data.map((day) => {
          const date = parseISO(day.check_in);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <div
              key={day.check_in}
              className={`relative rounded-lg p-1.5 text-center transition-colors cursor-default group ${getCellColor(day)} ${isWeekend ? "ring-1 ring-gray-200 dark:ring-slate-600" : ""}`}
              title={buildTooltip(day)}
            >
              <div className="text-[10px] font-medium opacity-60">
                {format(date, "d MMM", { locale: it })}
              </div>
              <div className="text-sm font-bold leading-tight mt-0.5">
                {getDayLabel(day)}
              </div>
              {day.rank != null && day.total_hotels > 0 && (
                <div className="text-[9px] opacity-50 mt-0.5">
                  #{day.rank}/{day.total_hotels}
                </div>
              )}

              {/* Tooltip on hover */}
              <div className="absolute z-10 left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-44 pointer-events-none">
                <div className="bg-gray-900 dark:bg-slate-700 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                  <div className="font-semibold mb-1">{format(date, "EEEE d MMMM", { locale: it })}</div>
                  {day.own_min != null ? (
                    <>
                      <div>Tuo prezzo: <span className="font-bold">€{Math.round(day.own_min)}</span></div>
                      {day.best_competitor != null && (
                        <div>Miglior comp.: <span className="font-bold">€{Math.round(day.best_competitor)}</span></div>
                      )}
                      {day.rank != null && (
                        <div>Posizione: <span className="font-bold">#{day.rank}</span> di {day.total_hotels}</div>
                      )}
                    </>
                  ) : (
                    <div className="opacity-70">Nessun dato</div>
                  )}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-slate-700" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-teal-100 dark:bg-teal-900/40" />
          #1 (il migliore)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-amber-100 dark:bg-amber-900/30" />
          #2
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-red-100 dark:bg-red-900/30" />
          #3+
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-gray-100 dark:bg-slate-700/50" />
          Nessun dato
        </div>
      </div>
    </div>
  );
}

function buildTooltip(day: CalendarDay): string {
  if (day.own_min == null) return "Nessun dato disponibile";
  let tip = `€${Math.round(day.own_min)}`;
  if (day.best_competitor != null) tip += ` | Comp.: €${Math.round(day.best_competitor)}`;
  if (day.rank != null) tip += ` | #${day.rank}/${day.total_hotels}`;
  return tip;
}
