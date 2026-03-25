import type { ComparisonRow, CalendarDay } from "../types";

/** Convert comparison rows to CSV and trigger browser download. */
export function exportComparisonCsv(rows: ComparisonRow[], filename = "ratescope_prezzi.csv") {
  if (rows.length === 0) return;

  const allOtas = Array.from(new Set(rows.flatMap((r) => Object.keys(r.ota_prices)))).sort();

  const header = ["Hotel", "Tuo hotel", "Posizione", ...allOtas.map((o) => o.toUpperCase()), "Min"].join(";");

  const lines = rows.map((r) => {
    const otaCols = allOtas.map((ota) => {
      const p = r.ota_prices[ota];
      return p != null ? Number(p).toFixed(2) : "";
    });
    return [
      `"${r.hotel_name}"`,
      r.is_own_hotel ? "Si" : "No",
      r.rank,
      ...otaCols,
      r.min_price != null ? Number(r.min_price).toFixed(2) : "",
    ].join(";");
  });

  downloadCsv([header, ...lines].join("\n"), filename);
}

/** Convert calendar data to CSV. */
export function exportCalendarCsv(days: CalendarDay[], filename = "ratescope_calendario.csv") {
  if (days.length === 0) return;

  const header = ["Data Check-in", "Tuo Prezzo Min", "Miglior Competitor", "Posizione", "Hotel Totali"].join(";");

  const lines = days.map((d) =>
    [
      d.check_in,
      d.own_min != null ? Number(d.own_min).toFixed(2) : "",
      d.best_competitor != null ? Number(d.best_competitor).toFixed(2) : "",
      d.rank ?? "",
      d.total_hotels,
    ].join(";")
  );

  downloadCsv([header, ...lines].join("\n"), filename);
}

function downloadCsv(content: string, filename: string) {
  // BOM for Excel UTF-8 compatibility
  const bom = "\uFEFF";
  const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
