import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HistoryPoint } from "../types";

const COLORS = ["#1D9E75", "#D85A30", "#6366f1", "#f59e0b", "#ec4899", "#06b6d4", "#8b5cf6", "#10b981"];

interface Props {
  data: HistoryPoint[];
  isLoading: boolean;
}

export default function CompetitorTrend({ data, isLoading }: Props) {
  // Group data by ota_code (which in history/all is actually hotel_name)
  const hotelNames = useMemo(
    () => Array.from(new Set(data.map((d) => d.ota_code))),
    [data]
  );

  const [selectedHotels, setSelectedHotels] = useState<Set<string>>(new Set());

  // Auto-select all hotels on first load
  useMemo(() => {
    if (hotelNames.length > 0 && selectedHotels.size === 0) {
      setSelectedHotels(new Set(hotelNames));
    }
  }, [hotelNames]);

  const visibleHotels = hotelNames.filter((h) => selectedHotels.has(h));

  // Pivot: date → { date: string, [hotelName]: number }
  const chartData = useMemo(() => {
    const byDate: Record<string, Record<string, string | number>> = {};
    for (const pt of data) {
      if (!selectedHotels.has(pt.ota_code)) continue;
      if (!byDate[pt.date]) byDate[pt.date] = { date: pt.date };
      byDate[pt.date][pt.ota_code] = pt.min_price;
    }
    return Object.values(byDate).sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );
  }, [data, selectedHotels]);

  const toggleHotel = (name: string) => {
    setSelectedHotels((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 dark:text-slate-500">
        Caricamento...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 dark:text-slate-500">
        Nessuno storico disponibile per i competitor.
      </div>
    );
  }

  // Y-axis domain
  const allPrices = data
    .filter((d) => selectedHotels.has(d.ota_code))
    .map((d) => d.min_price);
  const minVal = allPrices.length ? Math.min(...allPrices) : 0;
  const maxVal = allPrices.length ? Math.max(...allPrices) : 200;
  const pad = Math.max((maxVal - minVal) * 0.15, 5);
  const yMin = Math.max(0, Math.floor(minVal - pad));
  const yMax = Math.ceil(maxVal + pad);

  return (
    <div>
      {/* Hotel filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {hotelNames.map((name, i) => {
          const active = selectedHotels.has(name);
          const color = COLORS[i % COLORS.length];
          return (
            <button
              key={name}
              onClick={() => toggleHotel(name)}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                active
                  ? "border-current opacity-100"
                  : "border-gray-200 dark:border-slate-600 opacity-40"
              }`}
              style={{ color: active ? color : undefined }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              {name.length > 25 ? name.slice(0, 24) + "…" : name}
            </button>
          );
        })}
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 dark:text-slate-500">
          Seleziona almeno un hotel per visualizzare il grafico.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickFormatter={(v) => {
                const [, m, d] = String(v).split("-");
                return `${d}/${m}`;
              }}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickFormatter={(v) => `€${v}`}
              width={55}
            />
            <Tooltip
              formatter={(v: number | string, name: string) => [`€${Number(v).toFixed(2)}`, name]}
              labelFormatter={(l) => `Check-in: ${l}`}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {visibleHotels.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                name={name.length > 20 ? name.slice(0, 19) + "…" : name}
                stroke={COLORS[hotelNames.indexOf(name) % COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
