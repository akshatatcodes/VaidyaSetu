import React from 'react';
import { Search, RefreshCw } from 'lucide-react';

export default function LabSearchBar({
  currentLabel,
  itemCount,
  search,
  setSearch,
  onRefresh,
  refreshing
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white/80 dark:bg-slate-900/80 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
          Current View:
        </span>
        <span className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold text-xs">
          {currentLabel} ({itemCount} items)
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patient, test, token..."
            className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl focus:border-cyan-500 outline-none text-slate-900 dark:text-white w-60"
          />
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 transition-all cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-500' : ''}`} />
        </button>
      </div>
    </div>
  );
}
