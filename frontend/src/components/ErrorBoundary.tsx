import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] render error:", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 max-w-xl w-full space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <h1 className="text-lg font-bold text-red-700">Errore di rendering</h1>
          </div>
          <p className="text-sm text-gray-600">
            Si è verificato un errore imprevisto. Copia il messaggio qui sotto e segnalalo.
          </p>
          <pre className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-4 overflow-auto max-h-60 whitespace-pre-wrap">
            {error.message}
            {"\n\n"}
            {error.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"
          >
            Ricarica la pagina
          </button>
        </div>
      </div>
    );
  }
}
