import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authApi } from "../api/auth";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-[14px] border border-gray-200 dark:border-slate-700 p-6 space-y-4">
      <h2 className="font-semibold text-gray-800 dark:text-slate-200">{title}</h2>
      {children}
    </div>
  );
}

const inputClass =
  "w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:bg-gray-50 dark:disabled:bg-slate-800 disabled:text-gray-400 dark:disabled:text-slate-500 disabled:cursor-default";

const labelClass = "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1";

export default function Settings() {
  const { user, refreshMe, isDemoMode } = useAuth();

  // Profile
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [profileEmail, setProfileEmail] = useState(user?.email ?? "");
  const [profilePassword, setProfilePassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode) return;
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const emailChanged = profileEmail !== user?.email;
      const nameChanged = fullName !== user?.full_name;
      if (!emailChanged && !nameChanged) {
        setProfileMsg({ ok: true, text: "Nessuna modifica da salvare." });
        return;
      }
      await authApi.updateMe({
        full_name: nameChanged ? fullName : undefined,
        email: emailChanged ? profileEmail : undefined,
        current_password: emailChanged ? profilePassword : undefined,
      });
      await refreshMe();
      setProfilePassword("");
      setProfileMsg({ ok: true, text: "Profilo aggiornato." });
    } catch (e: unknown) {
      const axErr = e as { response?: { data?: { detail?: string } } };
      setProfileMsg({ ok: false, text: axErr.response?.data?.detail ?? "Errore nel salvataggio." });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode) return;
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: "Le password non corrispondono." });
      return;
    }
    if (newPw.length < 8) {
      setPwMsg({ ok: false, text: "La nuova password deve avere almeno 8 caratteri." });
      return;
    }
    setPwSaving(true);
    try {
      await authApi.updateMe({ current_password: currentPw, new_password: newPw });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setPwMsg({ ok: true, text: "Password aggiornata." });
    } catch (e: unknown) {
      const axErr = e as { response?: { data?: { detail?: string } } };
      setPwMsg({ ok: false, text: axErr.response?.data?.detail ?? "Errore nel cambio password." });
    } finally {
      setPwSaving(false);
    }
  };

  const handleResetTour = () => {
    localStorage.removeItem("ratescope_tour_v1");
    window.location.href = "/dashboard";
  };

  const planLabel: Record<string, string> = {
    free: "Free",
    basic: "Basic",
    pro: "Pro",
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Impostazioni account</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Gestisci il tuo profilo e le credenziali di accesso.</p>
      </div>

      {isDemoMode && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          In modalità demo le modifiche non vengono salvate.
        </div>
      )}

      {/* Plan info */}
      <Section title="Piano attivo">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">
              {planLabel[user?.plan ?? "free"] ?? user?.plan}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Account creato il{" "}
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString("it-IT")
                : "—"}
            </p>
          </div>
          {user?.plan === "free" && (
            <span className="text-xs bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-700 px-3 py-1 rounded-full font-medium">
              Piano gratuito
            </span>
          )}
        </div>
      </Section>

      {/* Profile */}
      <Section title="Profilo">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {profileMsg && (
            <p className={`text-sm px-3 py-2 rounded-lg border ${profileMsg.ok ? "bg-teal-50 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"}`}>
              {profileMsg.text}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nome completo</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isDemoMode}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                disabled={isDemoMode}
                className={inputClass}
              />
            </div>
          </div>
          {profileEmail !== user?.email && !isDemoMode && (
            <div>
              <label className={labelClass}>Password attuale (richiesta per cambiare email)</label>
              <input
                type="password"
                value={profilePassword}
                onChange={(e) => setProfilePassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
          )}
          <button
            type="submit"
            disabled={profileSaving || isDemoMode}
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
          >
            {profileSaving ? "Salvataggio..." : "Salva profilo"}
          </button>
        </form>
      </Section>

      {/* Password */}
      <Section title="Cambia password">
        <form onSubmit={handleSavePassword} className="space-y-4">
          {pwMsg && (
            <p className={`text-sm px-3 py-2 rounded-lg border ${pwMsg.ok ? "bg-teal-50 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"}`}>
              {pwMsg.text}
            </p>
          )}
          <div>
            <label className={labelClass}>Password attuale</label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              disabled={isDemoMode}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nuova password</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                disabled={isDemoMode}
                placeholder="Min. 8 caratteri"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Conferma nuova password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                disabled={isDemoMode}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={pwSaving || isDemoMode}
            className="bg-gray-800 dark:bg-slate-600 hover:bg-gray-900 dark:hover:bg-slate-500 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
          >
            {pwSaving ? "Aggiornamento..." : "Cambia password"}
          </button>
        </form>
      </Section>

      {/* Tour */}
      <Section title="Tour guidato">
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Rivedi il tour di benvenuto che spiega le funzioni principali di RateScope.
        </p>
        <button
          onClick={handleResetTour}
          className="text-sm text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 px-4 py-2 rounded-lg transition-colors font-medium"
        >
          Riavvia tour guidato
        </button>
      </Section>
    </div>
  );
}
