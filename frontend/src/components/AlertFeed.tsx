import type { AlertLog } from "../types";
import { alertsApi } from "../api/alerts";

const severityStyles = {
  info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",
  warning: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300",
  danger: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300",
};

const severityDot = {
  info: "bg-blue-400",
  warning: "bg-orange-400",
  danger: "bg-red-500",
};

interface AlertFeedProps {
  logs: AlertLog[];
  onRead: (id: string) => void;
}

export default function AlertFeed({ logs, onRead }: AlertFeedProps) {
  const handleRead = async (id: string) => {
    try {
      await alertsApi.markRead(id);
      onRead(id);
    } catch {
      // silenzioso: se l'API fallisce, lo stato non viene aggiornato
    }
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 dark:text-slate-500 text-sm">
        Nessun alert ricevuto.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {logs.map((log) => (
        <li
          key={log.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
            severityStyles[log.severity]
          } ${log.is_read ? "opacity-60" : ""}`}
        >
          <span
            className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${severityDot[log.severity]}`}
          />
          <span className="flex-1">{log.message}</span>
          {!log.is_read && (
            <button
              onClick={() => handleRead(log.id)}
              className="text-xs underline opacity-70 hover:opacity-100 flex-shrink-0"
            >
              Letto
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
