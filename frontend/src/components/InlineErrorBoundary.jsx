import React from 'react';

export default class InlineErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[InlineErrorBoundary]', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const title = this.props.title || 'Section failed to render';
    const message = this.state.error?.message || String(this.state.error || 'Unknown error');

    if (typeof this.props.fallback === 'function') {
      return this.props.fallback({ title, message, error: this.state.error });
    }

    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-3xl border border-amber-200/40 dark:border-amber-500/20 bg-white/60 dark:bg-black/20 backdrop-blur-md p-6">
          <div className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-700 dark:text-amber-300">
            {title}
          </div>
          <div className="mt-2 text-sm text-slate-700 dark:text-gray-200">
            {message}
          </div>
          <button
            className="mt-5 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

