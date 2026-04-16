import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  ArrowLeft, Download, TrendingUp, Calculator, User,
  Tag, Edit2, X, RefreshCw, Activity, BarChart2, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { API_URL } from '../config/api';

const TYPE_META = {
  real_change: { label: 'Real Change',    color: '#10b981', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  correction:  { label: 'Correction',     color: '#f59e0b', bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20'   },
  initial:     { label: 'Initial Entry',  color: '#3b82f6', bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20'    },
  sync:        { label: 'Sync',           color: '#818cf8', bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  border: 'border-indigo-500/20'  },
};

const formatField = (f) => f?.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()) || f;
const formatValue = (v) => {
  if (v == null) return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (Array.isArray(v)) return v.length > 0 ? v.join(', ') : 'None';
  return String(v);
};

const ChangeHistory = () => {
  const { user } = useUser();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user) {
      axios.get(`${API_URL}/profile/history/${user.id}`)
        .then(res => { if (res.data.status === 'success') setHistory(res.data.data); })
        .catch(err => console.error('Error fetching history:', err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  /* ── PDF export ── */
  const handleExport = () => {
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
    const userName = user?.fullName || user?.firstName || 'User';
    const sorted = [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const rows = sorted.map((item, idx) => {
      const date = new Date(item.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
      const m = TYPE_META[item.changeType] || {};
      const change = item.oldValue != null
        ? `<span style="text-decoration:line-through;color:#9ca3af;font-size:11px;">${formatValue(item.oldValue)}</span><br/><strong>${formatValue(item.newValue)}</strong>`
        : `<strong>${formatValue(item.newValue)}</strong>`;
      return `<tr style="background:${idx % 2 === 0 ? '#fff' : '#f9fafb'}">
        <td style="padding:10px 14px;font-weight:600;">${formatField(item.field)}</td>
        <td style="padding:10px 14px;">${change}</td>
        <td style="padding:10px 14px;"><span style="background:${m.color}20;color:${m.color};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">${m.label || item.changeType}</span></td>
        <td style="padding:10px 14px;color:#6b7280;font-size:12px;">${item.notes || item.intent || '—'}</td>
        <td style="padding:10px 14px;font-size:12px;">${date}</td>
        <td style="padding:10px 14px;font-size:12px;color:#6b7280;">${item.source || '—'}</td></tr>`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>VaidyaSetu — Audit Log</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#f9fafb}
@media print{.no-print{display:none!important}@page{margin:20mm;size:A4 landscape}}
.page{max-width:1100px;margin:0 auto;padding:40px 32px}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;padding-bottom:16px;border-bottom:3px solid #10b981}
.logo{font-size:24px;font-weight:900;color:#059669}.logo span{color:#111}
.meta{text-align:right;color:#6b7280;font-size:12px;line-height:1.8}
.title{font-size:20px;font-weight:800;margin-bottom:4px}.subtitle{font-size:13px;color:#6b7280;margin-bottom:24px}
.stats{display:flex;gap:12px;margin-bottom:28px}
.stat{flex:1;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:14px 18px;text-align:center}
.sn{font-size:26px;font-weight:900}.sl{font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-top:3px}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);font-size:13px}
thead tr{background:#111827;color:#fff}thead th{padding:10px 14px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em}
tbody tr{border-bottom:1px solid #f0f0f0}
.footer{margin-top:28px;text-align:center;color:#d1d5db;font-size:11px;padding-top:16px;border-top:1px solid #e5e7eb}
.pbtn{display:inline-flex;align-items:center;gap:8px;background:#059669;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:24px}
</style></head><body><div class="page">
<button class="pbtn no-print" onclick="window.print()">⬇ Download as PDF (Ctrl+P)</button>
<div class="header"><div class="logo">Vaidya<span>Setu</span></div>
<div class="meta"><strong>${userName}</strong><br/>Exported: ${dateStr}<br/>Records: ${sorted.length}</div></div>
<div class="title">Health Data Audit Log</div>
<div class="subtitle">Complete chronological record of all health parameter changes.</div>
<div class="stats">
  <div class="stat"><div class="sn" style="color:#111">${sorted.length}</div><div class="sl">Total</div></div>
  <div class="stat"><div class="sn" style="color:#10b981">${sorted.filter(h=>h.changeType==='real_change').length}</div><div class="sl">Real Changes</div></div>
  <div class="stat"><div class="sn" style="color:#f59e0b">${sorted.filter(h=>h.changeType==='correction').length}</div><div class="sl">Corrections</div></div>
  <div class="stat"><div class="sn" style="color:#3b82f6">${sorted.filter(h=>h.changeType==='initial').length}</div><div class="sl">Initial</div></div>
</div>
<table><thead><tr><th>Field</th><th>Change</th><th>Type</th><th>Note</th><th>Timestamp</th><th>Source</th></tr></thead>
<tbody>${rows || '<tr><td colspan="6" style="padding:24px;text-align:center;color:#9ca3af">No records.</td></tr>'}</tbody></table>
<div class="footer">Auto-generated by VaidyaSetu &bull; Confidential &bull; ${dateStr}</div>
</div></body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
  };

  const handleReclassify = async (id, newType) => {
    setUpdating(true);
    try {
      const res = await axios.put(`${API_URL}/profile/history/${id}/reclassify`, { changeType: newType });
      if (res.data.status === 'success')
        setHistory(prev => prev.map(h => h._id === id ? { ...h, changeType: newType } : h));
    } catch { alert('Failed to reclassify log.'); }
    finally { setUpdating(false); setEditingId(null); }
  };

  const filteredHistory = history
    .filter(item => filter === 'all' || item.changeType === filter)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const weightData = history
    .filter(item => item.field === 'weight')
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map(item => ({
      date: new Date(item.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' }),
      weight: item.newValue, type: item.changeType
    }));

  /* Stats */
  const totalEntries  = history.length;
  const realChanges   = history.filter(h => h.changeType === 'real_change').length;
  const corrections   = history.filter(h => h.changeType === 'correction').length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Loading Audit Log…</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto w-full pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── HEADER ── */}
      <div className="relative rounded-[2rem] overflow-hidden mb-8 border border-white/8 p-8"
        style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #06111a 60%, #0a0f1e 100%)' }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Link to="/profile" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-emerald-400 transition-colors mb-3 uppercase tracking-widest">
              <ArrowLeft size={13} /> Back to Profile
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <Activity size={18} className="text-emerald-400" />
              </div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Audit Trail</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">
              Data <span className="text-emerald-400">History Log</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Every change to your health matrix, timestamped and classified.</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-white/6 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/30 rounded-2xl text-gray-300 hover:text-emerald-400 text-sm font-bold transition-all active:scale-95 self-start md:self-auto"
          >
            <Download size={15} /> Export PDF
          </button>
        </div>
      </div>

      {/* ── STAT TILES ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Entries', value: totalEntries, color: '#e2e8f0', icon: BarChart2 },
          { label: 'Real Changes',  value: realChanges,  color: '#10b981', icon: TrendingUp },
          { label: 'Corrections',   value: corrections,  color: '#f59e0b', icon: Edit2 },
          { label: 'Integrity',     value: totalEntries > 0 ? `${Math.round((realChanges / totalEntries) * 100)}%` : '—', color: '#818cf8', icon: Shield },
        ].map(stat => (
          <div key={stat.label}
            className="relative rounded-2xl border border-white/8 bg-white/4 backdrop-blur p-5 overflow-hidden group hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-5 -translate-y-6 translate-x-6 pointer-events-none"
              style={{ background: stat.color }} />
            <div className="flex items-center gap-2 mb-3">
              <stat.icon size={13} style={{ color: stat.color }} />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{stat.label}</span>
            </div>
            <div className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* ── WEIGHT CHART ── */}
      {weightData.length > 1 && (
        <div className="rounded-3xl border border-white/8 bg-white/4 backdrop-blur p-6 md:p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-widest">Weight Journey</h2>
              <p className="text-gray-500 text-xs mt-1">Real changes vs. data corrections over time</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2 text-gray-400"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Real</div>
              <div className="flex items-center gap-2 text-gray-400"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Correction</div>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} domain={['dataMin - 3', 'dataMax + 3']} unit="kg" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#e5e7eb' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Line type="monotone" dataKey="weight" stroke="#10B981" strokeWidth={2.5}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    const color = payload.type === 'correction' ? '#f59e0b' : '#10b981';
                    return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={5} fill={color} stroke="#0f172a" strokeWidth={2} />;
                  }}
                  activeDot={{ r: 7, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── LOG TABLE ── */}
      <div className="rounded-3xl border border-white/8 bg-white/4 backdrop-blur overflow-hidden">
        {/* Table header */}
        <div className="p-5 md:p-6 border-b border-white/6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-base font-black text-white uppercase tracking-widest">Recent Modifications</h2>
          <div className="flex items-center bg-black/30 p-1 rounded-xl border border-white/6 flex-wrap gap-1">
            {['all', 'real_change', 'correction', 'initial'].map(type => {
              const m = TYPE_META[type];
              return (
                <button key={type} onClick={() => { setFilter(type); setCurrentPage(1); }}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all uppercase tracking-wider ${
                    filter === type
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'text-gray-500 hover:text-gray-200'
                  }`}>
                  {type === 'all' ? 'All' : (m?.label || type)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/6">
                {['Field', 'Change', 'Type', 'Intent / Note', 'Timestamp', 'Source'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[10px] font-black text-gray-600 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedHistory.length > 0 ? paginatedHistory.map((item, idx) => {
                const m = TYPE_META[item.changeType] || { label: item.changeType, bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };
                return (
                  <tr key={idx}
                    className={`border-b border-white/4 transition-colors hover:bg-white/3 ${editingId === item._id ? 'bg-white/5' : ''}`}>
                    {/* Field */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-white/5 rounded-lg text-gray-500">
                          <Tag size={12} />
                        </div>
                        <span className="text-white text-sm font-semibold capitalize whitespace-nowrap">
                          {formatField(item.field)}
                        </span>
                      </div>
                    </td>
                    {/* Change */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5">
                        {item.oldValue != null && (
                          <span className="text-gray-600 line-through text-[11px]">
                            {Array.isArray(item.oldValue) ? item.oldValue.join(', ') : String(item.oldValue)}
                          </span>
                        )}
                        <span className="text-white font-bold text-sm">
                          {item.newValue == null ? 'None' : (Array.isArray(item.newValue) ? item.newValue.join(', ') : String(item.newValue))}
                        </span>
                      </div>
                    </td>
                    {/* Type */}
                    <td className="px-5 py-4">
                      {editingId === item._id ? (
                        <div className="flex gap-1.5 flex-wrap">
                          <button onClick={() => handleReclassify(item._id, 'correction')} disabled={updating}
                            className="px-2 py-1 bg-amber-500/15 text-amber-400 text-[10px] font-black rounded-lg border border-amber-500/20 hover:bg-amber-500 hover:text-white transition-all">
                            CORRECTION
                          </button>
                          <button onClick={() => handleReclassify(item._id, 'real_change')} disabled={updating}
                            className="px-2 py-1 bg-emerald-500/15 text-emerald-400 text-[10px] font-black rounded-lg border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all">
                            REAL CHANGE
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-gray-600 hover:text-white transition-colors">
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group/edit cursor-pointer" onClick={() => setEditingId(item._id)}>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${m.bg} ${m.text} ${m.border}`}>
                            {m.label || item.changeType}
                          </span>
                          <Edit2 size={11} className="text-gray-700 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>
                    {/* Note */}
                    <td className="px-5 py-4">
                      <p className="text-gray-500 text-xs max-w-[180px] truncate" title={item.notes || item.intent}>
                        {item.notes || item.intent || '—'}
                      </p>
                    </td>
                    {/* Timestamp */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-gray-200 text-xs font-semibold">
                        {new Date(item.timestamp).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-gray-600 text-[10px] mt-0.5">
                        {new Date(item.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    {/* Source */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                        {item.source === 'user' ? <User size={11} /> : <Calculator size={11} />}
                        <span className="capitalize">{item.source}</span>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <Activity size={32} className="text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm font-semibold">No history entries for this filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/6 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredHistory.length)} of {filteredHistory.length} entries
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-400 text-xs font-bold hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                Prev
              </button>
              <div className="px-3 text-xs text-gray-400 font-semibold text-center min-w-[60px]">
                {currentPage} / {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-400 text-xs font-bold hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangeHistory;
