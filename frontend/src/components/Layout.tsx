import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ErrorBoundary from "./ErrorBoundary";

export default function Layout() {
  const { user, logout, isDemoMode, resetOnboarding } = useAuth();
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
        ? "bg-teal-50 text-teal-700"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      {isDemoMode && (
        <div className="bg-amber-500 text-white text-center text-xs py-1.5 px-4 flex items-center justify-center gap-2">
          <span>Modalità demo — i dati sono simulati e non vengono salvati.</span>
          <button
            onClick={handleLogout}
            className="underline hover:no-underline font-medium"
          >
            Esci dalla demo
          </button>
        </div>
      )}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
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
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/competitors" className={navLinkClass}>
              Competitor
            </NavLink>
            <NavLink to="/alerts" className={navLinkClass}>
              Alert
            </NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">{user?.email}</span>
            {!isDemoMode && (
              <button
                onClick={handleReset}
                className="text-sm text-gray-500 hover:text-teal-700 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-teal-50 hover:border-teal-200 transition-colors"
                title="Elimina la configurazione attuale e ricomincia dalla scelta dell'hotel"
              >
                Cambia hotel
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
    </div>
  );
}
