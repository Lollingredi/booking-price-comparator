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

const OTA_COLORS = [
  "#1D9E75",
  "#D85A30",
  "#6366f1",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
];

interface PriceChartProps {
  data: HistoryPoint[];
  isLoading?: boolean;
}

export default function PriceChart({ data, isLoading }: PriceChartProps) {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Caricamento...
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Nessuno storico disponibile.
      </div>
    );
  }

  // Pivot: date → { date: string, [ota_code]: number }
  const otaCodes = Array.from(new Set(data.map((d) => d.ota_code)));
  const byDate: Record<string, Record<string, string | number>> = {};
  for (const pt of data) {
    if (!byDate[pt.date]) byDate[pt.date] = { date: pt.date };
    byDate[pt.date][pt.ota_code] = pt.min_price;
  }
  const chartData = Object.values(byDate).sort((a, b) =>
    String(a["date"]).localeCompare(String(b["date"]))
  );

  // Compute Y-axis domain with 10% padding above/below
  const allPrices = data.map((d) => d.min_price).filter((v) => v != null);
  const minVal = Math.min(...allPrices);
  const maxVal = Math.max(...allPrices);
  const pad = Math.max((maxVal - minVal) * 0.15, 5);
  const yMin = Math.max(0, Math.floor(minVal - pad));
  const yMax = Math.ceil(maxVal + pad);

  return (
    <ResponsiveContainer width="100%" height={280}>
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
          formatter={(v: number | string) => [`€${Number(v).toFixed(2)}`, ""]}
          labelFormatter={(l) => `Data: ${l}`}
          contentStyle={{ borderRadius: 8, fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {otaCodes.map((ota, i) => (
          <Line
            key={ota}
            type="monotone"
            dataKey={ota}
            stroke={OTA_COLORS[i % OTA_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
