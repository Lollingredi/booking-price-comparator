interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "teal" | "coral" | "danger" | "neutral";
}

const accentMap = {
  teal: "text-teal-600",
  coral: "text-orange-500",
  danger: "text-red-500",
  neutral: "text-gray-800",
};

export default function MetricCard({
  label,
  value,
  sub,
  accent = "neutral",
}: MetricCardProps) {
  return (
    <div className="bg-gray-100 rounded-2xl p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">
        {label}
      </p>
      <p className={`text-3xl font-bold ${accentMap[accent]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
