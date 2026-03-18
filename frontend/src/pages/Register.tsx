import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

function RenderBanner() {
  return (
    <div className="w-full max-w-sm mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
      <span className="font-semibold">Nota:</span> Il backend e' ospitato su Render (piano gratuito) e si spegne dopo 15 minuti di inattivita'. La prima richiesta puo' richiedere <span className="font-semibold">30–60 secondi</span>. Attendi pazientemente.
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;
    if (status === 400 && detail) return `Registrazione fallita: ${detail}`;
    if (status === 400) return "L'email e' gia' in uso. Prova ad accedere.";
    if (status === 422) return "Dati non validi. Controlla i campi e riprova.";
    if (status && status >= 500) return "Errore del server. Potrebbe essere in avvio (30–60s): riprova tra poco.";
    if (!error.response) return "Impossibile raggiungere il server. E' in avvio su Render? Attendi 30–60s e riprova.";
  }
  return "Registrazione fallita. Riprova tra qualche secondo.";
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await register(email, password, fullName);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-3xl font-bold text-teal-600 text-center mb-2">RateScope</h1>
      <p className="text-center text-gray-500 text-sm mb-4">
        Crea il tuo account gratuito
      </p>
      <RenderBanner />
      <div className="w-full max-w-sm">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[14px] border border-gray-200 p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-800">Registrati</h2>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {isLoading ? "Registrazione in corso… (30–60s)" : "Crea account"}
          </button>
          <p className="text-center text-sm text-gray-500">
            Hai gia' un account?{" "}
            <Link to="/login" className="text-teal-600 hover:underline">
              Accedi
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
