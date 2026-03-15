import type { ComparisonRow } from "../types";

interface RateTableProps {
  rows: ComparisonRow[];
}

export default function RateTable({ rows }: RateTableProps) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Nessun dato disponibile. Configura il tuo hotel e i competitor.
      </div>
    );
  }

  const allOtas = Array.from(
    new Set(rows.flatMap((r) => Object.keys(r.ota_prices)))
  ).sort();

  return (
    <div className="overflow-x-auto rounded-[14px] border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Hotel
            </th>
            <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Rank
            </th>
            {allOtas.map((ota) => (
              <th
                key={ota}
                className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                {ota}
              </th>
            ))}
            <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Min
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.hotel_key}
              className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                row.is_own_hotel ? "bg-blue-50/60" : ""
              }`}
            >
              <td className="px-4 py-3 font-medium text-gray-800">
                {row.hotel_name}
                {row.is_own_hotel && (
                  <span className="ml-2 text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase tracking-wide">
                    Tu
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                    row.rank === 1
                      ? "bg-teal-100 text-teal-700"
                      : row.rank <= 3
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {row.rank}
                </span>
              </td>
              {allOtas.map((ota) => {
                const price = row.ota_prices[ota];
                return (
                  <td key={ota} className="px-4 py-3 text-right tabular-nums">
                    {price != null ? (
                      <span className="text-gray-800">€{Number(price).toFixed(2)}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">
                {row.min_price != null ? `€${Number(row.min_price).toFixed(2)}` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
