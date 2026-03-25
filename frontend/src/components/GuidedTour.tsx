import { useState, useEffect, useRef } from "react";

const TOUR_KEY = "ratescope_tour_v1";

const steps = [
  {
    title: "Benvenuto in RateScope",
    body: "Questo breve tour ti guiderà attraverso le funzionalità principali. Puoi saltarlo in qualsiasi momento e riavviarlo dalle Impostazioni.",
    icon: "👋",
  },
  {
    title: "Metriche in tempo reale",
    body: "Le 4 schede in cima mostrano il tuo prezzo minimo, la posizione nel ranking, il competitor più economico e gli alert non letti — tutto aggiornato ad ogni fetch.",
    icon: "📊",
  },
  {
    title: "Tabella confronto prezzi",
    body: "La tabella elenca tutti i tuoi competitor ordinati per prezzo. Il tuo hotel è evidenziato in verde. Clicca su «Aggiorna prezzi» per avviare un nuovo scraping.",
    icon: "📋",
  },
  {
    title: "Grafico storico prezzi",
    body: "Il grafico mostra l'andamento dei prezzi minimi nei prossimi 7 giorni per te e i tuoi competitor. Utile per anticipare oscillazioni stagionali.",
    icon: "📈",
  },
  {
    title: "Alert automatici",
    body: "RateScope ti notifica quando un competitor abbassa il prezzo sotto il tuo. Configura le soglie nella sezione Alert.",
    icon: "🔔",
  },
  {
    title: "Pronto!",
    body: "Hai visto tutto. Aggiungi i tuoi competitor nella sezione «Competitor», imposta gli alert e inizia a monitorare i prezzi. Buon lavoro!",
    icon: "🚀",
  },
];

interface GuidedTourProps {
  onClose?: () => void;
}

export default function GuidedTour({ onClose }: GuidedTourProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // small delay so the dashboard has rendered first
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  // Focus trap: sposta il focus dentro il dialog e blocca Tab all'interno
  useEffect(() => {
    if (!visible) return;
    const el = dialogRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[focusable.length - 1].focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { dismiss(); return; }
      if (e.key !== "Tab") return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, step]);

  const dismiss = () => {
    localStorage.setItem(TOUR_KEY, "done");
    setVisible(false);
    onClose?.();
  };

  const next = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  const prev = () => setStep((s) => Math.max(0, s - 1));

  if (!visible) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-slate-700">
          <div
            className="h-full bg-teal-500 transition-all duration-300"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-6">
          {/* Icon + title */}
          <div className="flex items-start gap-4 mb-4">
            <span className="text-3xl shrink-0 mt-0.5">{current.icon}</span>
            <div>
              <p className="text-xs font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-1">
                Passo {step + 1} di {steps.length}
              </p>
              <h2 id="tour-title" className="text-lg font-bold text-gray-900 dark:text-slate-100">{current.title}</h2>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed mb-6">{current.body}</p>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step
                    ? "bg-teal-500"
                    : i < step
                    ? "bg-teal-200 dark:bg-teal-700"
                    : "bg-gray-200 dark:bg-slate-600"
                }`}
                aria-label={`Vai al passo ${i + 1}`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={dismiss}
              className="text-sm text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            >
              Salta tour
            </button>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={prev}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Indietro
                </button>
              )}
              <button
                onClick={next}
                className="px-5 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
              >
                {isLast ? "Inizia!" : "Avanti"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useShouldShowTour(isDemoMode: boolean): [boolean, () => void] {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isDemoMode) return;
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) setShow(true);
  }, [isDemoMode]);

  const close = () => setShow(false);
  return [show, close];
}
