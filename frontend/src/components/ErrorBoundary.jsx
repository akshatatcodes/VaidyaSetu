import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Keep logging so devtools still has the stack.
    // Also helps when users report a "blank screen".
    console.error('[UI ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const message = this.state.error?.message || String(this.state.error || 'Unknown error');
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-2xl w-full rounded-2xl border border-red-200/50 dark:border-red-500/20 bg-white/60 dark:bg-black/20 backdrop-blur-md p-6">
          <div className="text-sm font-black uppercase tracking-widest text-red-600 dark:text-red-400">
            Something crashed
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 dark:text-white">
            The dashboard failed to render.
          </div>
          <div className="mt-3 text-sm text-slate-600 dark:text-gray-300">
            Open the browser console for the full stack trace. The short error is below:
          </div>
          <pre className="mt-4 text-xs overflow-auto rounded-xl bg-slate-950 text-slate-100 p-4 border border-slate-800">
            {message}
          </pre>
          <div className="mt-5 flex gap-3">
            <button
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-900 dark:text-white font-black text-xs"
              onClick={() => {
                try { navigator.clipboard.writeText(message); } catch { /* noop */ }
              }}
            >
              Copy error
            </button>
          </div>
        </div>
      </div>
    );
  }
}

