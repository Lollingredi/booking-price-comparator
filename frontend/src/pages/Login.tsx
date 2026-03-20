import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

function getLoginError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) return "Email o password non validi.";
    if (status && status >= 500) return "Errore del server. Il backend potrebbe essere in avvio su Render (30–60s): riprova tra poco.";
    if (!error.response) return "Impossibile raggiungere il server. E' in avvio su Render? Attendi 30–60s e riprova.";
  }
  return "Accesso fallito. Riprova tra qualche secondo.";
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(getLoginError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = () => {
    navigate("/demo/mappa");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-teal-600 text-center mb-2">RateScope</h1>
        <p className="text-center text-gray-500 dark:text-slate-400 text-sm mb-4">
          Rate shopping per albergatori italiani
        </p>
        <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          <span className="font-semibold">Nota:</span> Il backend e' ospitato su Render (piano gratuito) e si spegne dopo 15 minuti di inattivita'. La prima richiesta puo' richiedere <span className="font-semibold">30–60 secondi</span>. Attendi pazientemente.
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-800 rounded-[14px] border border-gray-200 dark:border-slate-700 p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200">Accedi</h2>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {isLoading ? "Accesso in corso… (30–60s)" : "Accedi"}
          </button>
          <p className="text-center text-sm text-gray-500 dark:text-slate-400">
            Non hai un account?{" "}
            <Link to="/register" className="text-teal-600 hover:underline">
              Registrati
            </Link>
          </p>
        </form>

        {/* Demo CTA */}
        <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-[14px] p-4 text-center">
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium mb-1">
            Vuoi esplorare senza registrarti?
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
            Accedi con dati dimostrativi — nessun account necessario
          </p>
          <button
            onClick={handleDemo}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 rounded-lg text-sm transition-colors"
          >
            Scegli il tuo hotel sulla mappa →
          </button>
        </div>
      </div>
    </div>
  );
}
