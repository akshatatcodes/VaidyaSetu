import React from 'react';
import { RefreshCw, AlertTriangle, Inbox, CheckCircle2, MicOff, WifiOff } from 'lucide-react';

/**
 * Unified Page State Handler for MediKiosk / VaidyaSetu
 * Phase 48 Requirement: Standardized Loading, Empty, Error, Success, and Retry states across all views.
 */
export const LoadingState = ({ message = "Loading data..." }) => (
  <div className="w-full py-12 flex flex-col items-center justify-center text-center p-6 bg-white/40 dark:bg-black/20 rounded-3xl backdrop-blur-md border border-slate-200/50 dark:border-slate-800 animate-pulse">
    <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 dark:border-t-emerald-400 animate-spin mb-4" />
    <p className="text-sm font-semibold text-slate-600 dark:text-gray-300">{message}</p>
  </div>
);

export const EmptyState = ({ 
  title = "No data available", 
  message = "There are no records to display at this time.", 
  icon: Icon = Inbox,
  actionLabel,
  onAction 
}) => (
  <div className="w-full py-12 flex flex-col items-center justify-center text-center p-8 bg-white/40 dark:bg-black/20 rounded-3xl backdrop-blur-md border border-slate-200/50 dark:border-slate-800">
    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 dark:text-gray-400 mb-4">
      <Icon className="w-7 h-7" />
    </div>
    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{title}</h3>
    <p className="text-sm text-slate-500 dark:text-gray-400 max-w-sm mb-6">{message}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export const ErrorState = ({ 
  title = "Connection Error", 
  message = "We couldn't connect. Retry.", 
  onRetry,
  isNetworkError = true
}) => (
  <div className="w-full py-10 flex flex-col items-center justify-center text-center p-6 bg-red-500/5 dark:bg-red-500/10 rounded-3xl backdrop-blur-md border border-red-200 dark:border-red-800/40">
    <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
      {isNetworkError ? <WifiOff className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
    </div>
    <h3 className="text-base font-bold text-red-900 dark:text-red-200 mb-1">{title}</h3>
    <p className="text-sm text-red-700 dark:text-red-300 max-w-md mb-5">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Retry</span>
      </button>
    )}
  </div>
);

export const AIFailureState = ({ 
  message = "Voice processing failed. You can continue using touch/text.",
  onRetry
}) => (
  <div className="w-full p-4 mb-4 bg-amber-500/10 border border-amber-300 dark:border-amber-700/50 rounded-2xl flex items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
        <MicOff className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-bold text-amber-900 dark:text-amber-200">AI Input Unavailable</p>
        <p className="text-xs text-amber-700 dark:text-amber-300">{message}</p>
      </div>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] shrink-0"
      >
        Retry AI
      </button>
    )}
  </div>
);

export const SuccessState = ({ message = "Operation completed successfully.", children }) => (
  <div className="w-full">
    {message && (
      <div className="w-full p-3 mb-4 bg-emerald-500/10 border border-emerald-300 dark:border-emerald-700/50 rounded-2xl flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">{message}</p>
      </div>
    )}
    {children}
  </div>
);

export default function PageStateHandler({
  isLoading,
  loadingMessage,
  isError,
  errorMessage = "We couldn't connect. Retry.",
  isAiError,
  aiErrorMessage = "Voice processing failed. You can continue using touch/text.",
  isEmpty,
  emptyTitle,
  emptyMessage,
  emptyIcon,
  onRetry,
  onAiRetry,
  children
}) {
  if (isLoading) {
    return <LoadingState message={loadingMessage} />;
  }

  if (isError) {
    return <ErrorState message={errorMessage} onRetry={onRetry} />;
  }

  return (
    <>
      {isAiError && <AIFailureState message={aiErrorMessage} onRetry={onAiRetry} />}
      {isEmpty ? (
        <EmptyState title={emptyTitle} message={emptyMessage} icon={emptyIcon} />
      ) : (
        children
      )}
    </>
  );
}
