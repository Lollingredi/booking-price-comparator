import { useEffect, useState } from "react";
import AlertFeed from "../components/AlertFeed";
import { alertsApi } from "../api/alerts";
import type { AlertLog, AlertRule } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { DEMO_ALERT_LOGS, DEMO_ALERT_RULES } from "../demo/demoData";

const RULE_TYPE_LABELS: Record<string, string> = {
  competitor_price_drop: "Calo prezzo competitor",
  parity_issue: "Problema di parità",
  undercut: "Competitor più economico",
};

export default function Alerts() {
  const { isDemoMode } = useAuth();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [logs, setLogs] = useState<AlertLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [ruleType, setRuleType] = useState("undercut");
  const [threshold, setThreshold] = useState(10);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      setRules(DEMO_ALERT_RULES);
      setLogs(DEMO_ALERT_LOGS);
      setIsLoading(false);
      return;
    }
    Promise.all([alertsApi.listRules(), alertsApi.getLogs()])
      .then(([rulesRes, logsRes]) => {
        setRules(rulesRes.data);
        setLogs(logsRes.data);
      })
      .finally(() => setIsLoading(false));
  }, [isDemoMode]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isDemoMode) {
        const fakeRule: AlertRule = {
          id: `demo-rule-${Date.now()}`,
          user_id: "demo-user-id",
          rule_type: ruleType as AlertRule["rule_type"],
          threshold_value: threshold,
          is_active: true,
          notify_email: notifyEmail,
          notify_whatsapp: false,
          created_at: new Date().toISOString(),
        };
        setRules((prev) => [...prev, fakeRule]);
      } else {
        const { data } = await alertsApi.createRule({
          rule_type: ruleType,
          threshold_value: threshold,
          notify_email: notifyEmail,
        });
        setRules((prev) => [...prev, data]);
      }
    } catch {
      setError("Errore nella creazione della regola.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rule: AlertRule) => {
    if (isDemoMode) {
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r))
      );
      return;
    }
    const { data } = await alertsApi.updateRule(rule.id, { is_active: !rule.is_active });
    setRules((prev) => prev.map((r) => (r.id === data.id ? data : r)));
  };

  const handleDelete = async (id: string) => {
    if (isDemoMode) {
      setRules((prev) => prev.filter((r) => r.id !== id));
      return;
    }
    await alertsApi.deleteRule(id);
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  if (isLoading) return <div className="text-center py-16 text-gray-400 dark:text-slate-500">Caricamento...</div>;

  const inputClass = "w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400";

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Alert</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Configura le regole di notifica e consulta lo storico alert.</p>
      </div>

      {/* Rules list */}
      <div className="bg-white dark:bg-slate-800 rounded-[14px] border border-gray-200 dark:border-slate-700 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 dark:text-slate-200">Regole attive</h2>
        {rules.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-slate-500">Nessuna regola configurata.</p>
        )}
        <ul className="divide-y divide-gray-100 dark:divide-slate-700">
          {rules.map((rule) => (
            <li key={rule.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-slate-200">
                  {RULE_TYPE_LABELS[rule.rule_type] ?? rule.rule_type}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  Soglia: {rule.threshold_value}
                  {rule.rule_type === "competitor_price_drop" ? "%" : "€"} ·{" "}
                  Email: {rule.notify_email ? "sì" : "no"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(rule)}
                  className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                    rule.is_active
                      ? "border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20"
                      : "border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-700/50"
                  }`}
                >
                  {rule.is_active ? "Attiva" : "Inattiva"}
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
                >
                  Elimina
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Create rule form */}
        <form onSubmit={handleCreate} className="border-t border-gray-100 dark:border-slate-700 pt-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Nuova regola</h3>
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded px-2 py-1">{error}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Tipo</label>
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value)}
                className={inputClass}
              >
                <option value="undercut">Competitor più economico</option>
                <option value="parity_issue">Problema di parità</option>
                <option value="competitor_price_drop">Calo prezzo competitor (%)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                Soglia ({ruleType === "competitor_price_drop" ? "%" : "€"})
              </label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                min={0}
                step={0.5}
                className={inputClass}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.checked)}
              className="accent-teal-600"
            />
            Notifica via email
          </label>
          <button
            type="submit"
            disabled={saving}
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-4 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-60"
          >
            {saving ? "Creazione..." : "Crea regola"}
          </button>
        </form>
      </div>

      {/* Alert log */}
      <div>
        <h2 className="font-semibold text-gray-800 dark:text-slate-200 mb-3">Storico alert</h2>
        <AlertFeed
          logs={logs}
          onRead={(id) =>
            setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, is_read: true } : l)))
          }
        />
      </div>
    </div>
  );
}
