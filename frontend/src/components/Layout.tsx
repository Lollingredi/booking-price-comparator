import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import ErrorBoundary from "./ErrorBoundary";

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22" x2="7.05" y2="7.05"/><line x1="16.95" y1="16.95" x2="19.78" y2="19.78"/>
      <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="7.05" y2="16.95"/><line x1="16.95" y1="7.05" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function Layout() {
  const { user, logout, isDemoMode, resetOnboarding } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleReset = async () => {
    if (!window.confirm("Sei sicuro? Verranno eliminati il tuo hotel e tutti i competitor configurati, e potrai ricominciare dalla selezione sulla mappa.")) return;
    await resetOnboarding();
    navigate("/onboarding");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {isDemoMode && (
        <div className="bg-amber-500 text-white text-center text-xs py-1.5 px-4 flex items-center justify-center gap-2">
          <span>Modalità demo — i dati sono simulati e non vengono salvati.</span>
          <button onClick={handleLogout} className="underline hover:no-underline font-medium">
            Esci dalla demo
          </button>
        </div>
      )}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-teal-600">RateScope</span>
            {isDemoMode && (
              <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                DEMO
              </span>
            )}
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
            <NavLink to="/competitors" className={navLinkClass}>Competitor</NavLink>
            <NavLink to="/alerts" className={navLinkClass}>Alert</NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-slate-400 hidden sm:block">{user?.email}</span>
            {!isDemoMode && (
              <button
                onClick={handleReset}
                className="text-sm text-gray-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 px-3 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-200 dark:hover:border-teal-700 transition-colors"
                title="Elimina la configurazione attuale e ricomincia dalla scelta dell'hotel"
              >
                Cambia hotel
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 px-3 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Esci
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <footer className="border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-slate-500">
            Realizzato da{" "}
            <a
              href="https://rediverse.cc/projects"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:underline font-medium"
            >
              Redi Bako
            </a>
          </span>
          <button
            onClick={toggle}
            title={theme === "dark" ? "Passa al tema chiaro" : "Passa al tema scuro"}
            className="p-2 rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </footer>
    </div>
  );
}
