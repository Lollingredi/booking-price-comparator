import { addDays, format } from "date-fns";
import { useState, useEffect } from "react";
import AlertFeed from "../components/AlertFeed";
import CalendarHeatmap from "../components/CalendarHeatmap";
import MetricCard from "../components/MetricCard";
import PriceChart from "../components/PriceChart";
import RateTable from "../components/RateTable";
import GuidedTour, { useShouldShowTour } from "../components/GuidedTour";
import { useAuth } from "../contexts/AuthContext";
import { useComparison, useHistoryAll, useCalendar } from "../hooks/useRates";
import { alertsApi } from "../api/alerts";
import { hotelsApi } from "../api/hotels";
import { ratesApi } from "../api/rates";
import type { AlertLog, Hotel } from "../types";
import { DEMO_ALERT_LOGS } from "../demo/demoData";

export default function Dashboard() {
  const { user, isDemoMode } = useAuth();
  const [showTour, closeTour] = useShouldShowTour(isDemoMode);
  const today = new Date();
  const [checkIn] = useState(today);
  const [checkOut] = useState(addDays(today, 1));
  const [myHotel, setMyHotel] = useState<Hotel | null>(null);

  useEffect(() => {
    if (!isDemoMode) hotelsApi.getMine().then(({ data }) => setMyHotel(data)).catch(() => {});
  }, [isDemoMode]);

  const { data: comparison, isLoading: loadingComparison, refetch: refetchComparison } = useComparison(checkIn, checkOut);
  const ownHotel = comparison.find((r) => r.is_own_hotel);
  const { data: history, isLoading: loadingHistory, refetch: refetchHistory } = useHistoryAll(7);
  const { data: calendarData, isLoading: loadingCalendar } = useCalendar(30);

  const [fetching, setFetching] = useState(false);
  const [fetchMsg, setFetchMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [workflowRunUrl, setWorkflowRunUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Auto-refresh data when countdown reaches 0 (after workflow trigger)
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(async () => {
      const next = countdown - 1;
      setCountdown(next);
      if (next === 0) {
        await Promise.all([refetchComparison(), refetchHistory()]);
        setFetchMsg({ ok: true, text: "Dati aggiornati. Se i prezzi non compaiono, il workflow GitHub potrebbe non aver trovato tariffe — controlla il log." });
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [countdown, refetchComparison, refetchHistory]);

  const handleFetchNow = async () => {
    setFetching(true);
    setFetchMsg(null);
    setWorkflowRunUrl(null);
    setCountdown(0);
    try {
      const { data } = await ratesApi.fetchNow(
        format(checkIn, "yyyy-MM-dd"),
        format(checkOut, "yyyy-MM-dd"),
        7
      );
      if (data.workflow_triggered) {
        if (data.workflow_run_url) setWorkflowRunUrl(data.workflow_run_url);
        setCountdown(120);
        setFetchMsg({
          ok: true,
          text: "Workflow GitHub Actions avviato. I dati verranno ricaricati automaticamente in ~2 minuti.",
        });
      } else if (data.errors.length > 0) {
        setFetchMsg({ ok: false, text: `Errori: ${data.errors.join(" | ")}` });
      } else {
        setFetchMsg({ ok: true, text: `Trovati ${data.prices_found} prezzi. Aggiornamento in corso…` });
        await Promise.all([refetchComparison(), refetchHistory()]);
        setFetchMsg(null);
      }
    } catch (e: unknown) {
      const axErr = e as { response?: { status?: number; data?: { detail?: string } } };
      const msg = axErr.response?.data?.detail ?? (e instanceof Error ? e.message : String(e));
      setFetchMsg({ ok: false, text: msg });
    } finally {
      setFetching(false);
    }
  };

  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([]);
  useEffect(() => {
    if (isDemoMode) {
      setAlertLogs(DEMO_ALERT_LOGS);
      return;
    }
    alertsApi.getLogs(1, 10).then(({ data }) => setAlertLogs(data)).catch(() => {});
  }, [isDemoMode]);

  const unreadCount = alertLogs.filter((a) => !a.is_read).length;
  const ownRank = ownHotel?.rank ?? null;
  const ownMin = ownHotel?.min_price;
  const lowestComp = comparison
    .filter((r) => !r.is_own_hotel && r.min_price != null)
    .sort((a, b) => Number(a.min_price) - Number(b.min_price))[0];

  const hasFakeKey = !isDemoMode && myHotel?.booking_key?.startsWith("demo_");
  const hasNoKey = !isDemoMode && myHotel && !myHotel.booking_key;

  return (
    <div className="space-y-8">
      {showTour && <GuidedTour onClose={closeTour} />}
      {hasFakeKey && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-amber-500 text-lg shrink-0 mt-0.5">⚠️</span>
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Booking.com Slug non valido</span> — il tuo hotel usa ancora una chiave demo ({myHotel?.booking_key}).
            I prezzi non possono essere recuperati.{" "}
            <a href="/competitors" className="underline font-medium hover:text-amber-900 dark:hover:text-amber-200">
              Aggiorna il Booking.com Slug nelle impostazioni →
            </a>
          </div>
        </div>
      )}
      {hasNoKey && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-orange-500 text-lg shrink-0 mt-0.5">⚠️</span>
          <div className="text-sm text-orange-800 dark:text-orange-300">
            <span className="font-semibold">Slug Booking.com non configurato</span> — nessun codice slug trovato per il tuo hotel.
            I prezzi non possono essere recuperati.{" "}
            <a href="/competitors" className="underline font-medium hover:text-orange-900 dark:hover:text-orange-200">
              Imposta il Booking.com Slug nelle impostazioni →
            </a>
          </div>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          Buongiorno{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Prezzi per {format(checkIn, "dd/MM/yyyy")} — {format(checkOut, "dd/MM/yyyy")}
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Tuo prezzo min"
          value={ownMin != null ? `€${Number(ownMin).toFixed(0)}` : "—"}
          accent="teal"
        />
        <MetricCard
          label="Posizione"
          value={ownRank != null ? `#${ownRank}` : "—"}
          sub={`su ${comparison.length} hotel`}
          accent={ownRank === 1 ? "teal" : ownRank != null && ownRank <= 3 ? "coral" : "danger"}
        />
        <MetricCard
          label="Competitor più economico"
          value={
            lowestComp?.min_price != null
              ? `€${Number(lowestComp.min_price).toFixed(0)}`
              : "—"
          }
          sub={lowestComp?.hotel_name}
          accent="neutral"
        />
        <MetricCard
          label="Alert non letti"
          value={unreadCount}
          accent={unreadCount > 0 ? "danger" : "teal"}
        />
      </div>

      {/* Rate table */}
      <div>
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <h2 className="text-base font-semibold text-gray-800 dark:text-slate-200">Confronto prezzi OTA</h2>
          {!isDemoMode && (
            <button
              onClick={handleFetchNow}
              disabled={fetching}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 disabled:opacity-50 transition-colors"
            >
              {fetching ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Scraping...
                </>
              ) : (
                "Aggiorna prezzi"
              )}
            </button>
          )}
        </div>
        {fetchMsg && (
          <div className={`mb-3 px-3 py-2 rounded-lg text-sm flex items-start justify-between gap-3 ${fetchMsg.ok ? "bg-teal-50 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800" : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"}`}>
            <span>
              {fetchMsg.text}
              {countdown > 0 && (
                <span className="ml-2 font-mono font-semibold">
                  ({Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")})
                </span>
              )}
            </span>
            {workflowRunUrl && (
              <a
                href={workflowRunUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 underline font-medium hover:opacity-80"
              >
                Log GitHub →
              </a>
            )}
          </div>
        )}
        {loadingComparison ? (
          <div className="text-center py-8 text-gray-400 dark:text-slate-500">Caricamento...</div>
        ) : (
          <RateTable rows={comparison} />
        )}
      </div>

      {/* Calendar heatmap */}
      <div>
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <h2 className="text-base font-semibold text-gray-800 dark:text-slate-200">
            Calendario prezzi — prossimi 30 giorni
          </h2>
          <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-700 rounded-full px-3 py-1">
            Colore = posizionamento vs competitor
          </span>
        </div>
        <CalendarHeatmap data={calendarData} isLoading={loadingCalendar} />
      </div>

      {/* Chart + alerts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <h2 className="text-base font-semibold text-gray-800 dark:text-slate-200">
              Prezzi prossimi 7 giorni
            </h2>
            <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-700 rounded-full px-3 py-1">
              Prezzo minimo per data di check-in
            </span>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-[14px] border border-gray-200 dark:border-slate-700 p-4">
            <PriceChart data={history} isLoading={loadingHistory} />
          </div>
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-800 dark:text-slate-200 mb-3">
            Ultimi alert
          </h2>
          <AlertFeed
            logs={alertLogs}
            onRead={(id) =>
              setAlertLogs((prev) =>
                prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
