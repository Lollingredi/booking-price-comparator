import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { PriceSuggestion } from "../types";

interface Props {
  data: PriceSuggestion[];
  isLoading: boolean;
}

const signalStyles: Record<string, { bg: string; icon: string; border: string }> = {
  lower: {
    bg: "bg-red-50 dark:bg-red-900/15",
    border: "border-red-200 dark:border-red-800/50",
    icon: "↓",
  },
  raise: {
    bg: "bg-teal-50 dark:bg-teal-900/15",
    border: "border-teal-200 dark:border-teal-800/50",
    icon: "↑",
  },
  ok: {
    bg: "bg-gray-50 dark:bg-slate-700/30",
    border: "border-gray-200 dark:border-slate-700",
    icon: "=",
  },
  no_data: {
    bg: "bg-gray-50 dark:bg-slate-700/20",
    border: "border-gray-100 dark:border-slate-700/50",
    icon: "?",
  },
};

export default function SuggestionsPanel({ data, isLoading }: Props) {
  if (isLoading) {
    return <div className="text-center py-6 text-gray-400 dark:text-slate-500 text-sm">Analisi in corso...</div>;
  }

  const actionable = data.filter((s) => s.signal === "lower" || s.signal === "raise");
  const okCount = data.filter((s) => s.signal === "ok").length;

  if (data.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 dark:text-slate-500 text-sm">
        Nessun dato sufficiente per generare suggerimenti.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Summary */}
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 mb-2">
        {actionable.length > 0 ? (
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            {actionable.length} suggeriment{actionable.length === 1 ? "o" : "i"} attiv{actionable.length === 1 ? "o" : "i"}
          </span>
        ) : (
          <span className="font-semibold text-teal-600 dark:text-teal-400">Prezzi allineati al mercato</span>
        )}
        <span>{okCount}/{data.length} giorni OK</span>
      </div>

      {/* Show actionable items first, then OK items collapsed */}
      {actionable.length > 0 && actionable.map((s) => <SuggestionRow key={s.check_in} suggestion={s} />)}

      {okCount > 0 && actionable.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 py-1">
            {okCount} giorn{okCount === 1 ? "o" : "i"} con prezzo allineato...
          </summary>
          <div className="space-y-2 mt-2">
            {data.filter((s) => s.signal === "ok").map((s) => <SuggestionRow key={s.check_in} suggestion={s} />)}
          </div>
        </details>
      )}

      {actionable.length === 0 && data.filter((s) => s.signal !== "no_data").map((s) => <SuggestionRow key={s.check_in} suggestion={s} />)}
    </div>
  );
}

function SuggestionRow({ suggestion: s }: { suggestion: PriceSuggestion }) {
  const style = signalStyles[s.signal] || signalStyles.no_data;
  const d = parseISO(s.check_in);

  return (
    <div className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${style.bg} ${style.border}`}>
      <span className="text-lg leading-none mt-0.5 shrink-0 w-5 text-center font-bold opacity-60">
        {style.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
            {format(d, "EEE d MMM", { locale: it })}
          </span>
          {s.own_min != null && s.market_avg != null && (
            <span className="text-[10px] text-gray-400 dark:text-slate-500">
              €{Math.round(s.own_min)} vs media €{Math.round(s.market_avg)}
            </span>
          )}
          {s.diff_pct != null && s.signal !== "ok" && (
            <span className={`text-[10px] font-bold ${s.signal === "lower" ? "text-red-500" : "text-teal-600 dark:text-teal-400"}`}>
              {s.diff_pct > 0 ? "+" : ""}{s.diff_pct}%
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">{s.message}</p>
      </div>
    </div>
  );
}
