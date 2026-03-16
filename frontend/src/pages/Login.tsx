import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login, loginDemo } = useAuth();
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
    } catch {
      setError("Email o password non validi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = () => {
    loginDemo();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-teal-600 text-center mb-2">RateScope</h1>
        <p className="text-center text-gray-500 text-sm mb-8">
          Rate shopping per albergatori italiani
        </p>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[14px] border border-gray-200 p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-800">Accedi</h2>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
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
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {isLoading ? "Accesso in corso..." : "Accedi"}
          </button>
          <p className="text-center text-sm text-gray-500">
            Non hai un account?{" "}
            <Link to="/register" className="text-teal-600 hover:underline">
              Registrati
            </Link>
          </p>
        </form>

        {/* Demo CTA */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-[14px] p-4 text-center">
          <p className="text-sm text-amber-800 font-medium mb-1">
            Vuoi esplorare senza registrarti?
          </p>
          <p className="text-xs text-amber-600 mb-3">
            Accedi con dati dimostrativi — nessun account necessario
          </p>
          <button
            onClick={handleDemo}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 rounded-lg text-sm transition-colors"
          >
            Prova la demo →
          </button>
        </div>
      </div>
    </div>
  );
}
