import React, { useState, useEffect } from 'react';
import { useUser } from '../clerkMock.jsx';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Calendar, ArrowLeft, Filter, Download, History, 
  TrendingUp, AlertCircle, CheckCircle2, MoreHorizontal, ArrowRight,
  Calculator, User, Tag, Edit2, X, Check
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const ChangeHistory = () => {
  const { user } = useUser();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, correction, real_change
  const [editingId, setEditingId] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      axios.get(`${API_URL}/profile/history/${user.id}`)
        .then(res => {
          if (res.data.status === 'success') {
            setHistory(res.data.data);
          }
        })
        .catch(err => console.error('Error fetching history:', err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadNode = document.createElement('a');
    downloadNode.setAttribute("href", dataStr);
    downloadNode.setAttribute("download", `VaidyaSetu_Audit_Log_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadNode);
    downloadNode.click();
    downloadNode.remove();
  };

  const handleReclassify = async (id, newType) => {
    setUpdating(true);
    try {
      const res = await axios.put(`${API_URL}/profile/history/${id}/reclassify`, { changeType: newType });
      if (res.data.status === 'success') {
        setHistory(prev => prev.map(h => h._id === id ? { ...h, changeType: newType } : h));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to reclassify log.");
    } finally {
      setUpdating(false);
      setEditingId(null);
    }
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    return item.changeType === filter;
  });

  const weightData = history
    .filter(item => item.field === 'weight')
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map(item => ({
      date: new Date(item.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      weight: item.newValue,
      originalDate: item.timestamp,
      type: item.changeType,
      intent: item.intent
    }));

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>
  );

  const getTypeStyle = (type) => {
    switch (type) {
      case 'correction': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'real_change': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'initial': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'sync': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link to="/profile" className="flex items-center text-sm text-gray-400 hover:text-emerald-500 transition-colors mb-2">
            <ArrowLeft size={16} className="mr-1" /> Back to Profile
          </Link>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Data <span className="text-emerald-500">History Log</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-200 text-sm font-medium transition-all shadow-xl active:scale-95"
          >
            <Download size={16} className="mr-2" /> Export Log
          </button>
        </div>
      </div>

      {weightData.length > 1 && (
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-semibold text-white">Weight Journey</h2>
              <p className="text-gray-400 text-sm">Visualizing real changes vs. data corrections</p>
            </div>
            <div className="flex items-center space-x-4 text-xs">
               <div className="flex items-center text-gray-400">
                 <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div> Real Change
               </div>
               <div className="flex items-center text-gray-400">
                 <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div> Correction
               </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} unit="kg"/>
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '12px' }} itemStyle={{ color: '#E5E7EB' }} />
                <Line 
                  type="monotone" dataKey="weight" stroke="#10B981" strokeWidth={3} 
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    const color = payload.type === 'correction' ? '#F59E0B' : '#10B981';
                    return <circle cx={cx} cy={cy} r={6} fill={color} stroke="#111827" strokeWidth={2} />;
                  }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-gray-800/40 border border-gray-700/50 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-gray-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <h2 className="text-xl font-semibold text-white">Recent Modifications</h2>
           <div className="flex items-center bg-gray-900/50 p-1 rounded-xl border border-gray-700/50 flex-wrap gap-1">
             {['all', 'real_change', 'correction', 'initial'].map((type) => (
               <button
                 key={type}
                 onClick={() => setFilter(type)}
                 className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                   filter === type ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                 }`}
               >
                 {type.replace('_', ' ').toUpperCase()}
               </button>
             ))}
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-900/30 text-gray-400 text-xs font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Field</th>
                <th className="px-6 py-4">Change</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Intent/Note</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {filteredHistory.length > 0 ? filteredHistory.map((item, idx) => (
                <tr key={idx} className={`hover:bg-gray-700/20 transition-colors group ${editingId === item._id ? 'bg-gray-700/30' : ''}`}>
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-700/30 rounded-lg text-gray-300 group-hover:text-emerald-400 transition-colors">
                        <Tag size={16} />
                      </div>
                      <span className="text-white font-medium capitalize">{item.field.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col space-y-1 text-sm text-gray-300">
                      {item.oldValue != null && (
                         <span className="text-gray-500 line-through opacity-50 text-xs">
                           {Array.isArray(item.oldValue) ? item.oldValue.join(', ') : String(item.oldValue)}
                         </span>
                      )}
                      <span className="text-white font-bold">
                        {item.newValue == null ? 'None' : (Array.isArray(item.newValue) ? item.newValue.join(', ') : String(item.newValue))}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {editingId === item._id ? (
                      <div className="flex gap-2">
                         <button onClick={() => handleReclassify(item._id, 'correction')} disabled={updating} className="px-2 py-1 bg-amber-500/20 text-amber-500 text-[10px] font-bold rounded hover:bg-amber-500 hover:text-white transition-colors">CORRECTION</button>
                         <button onClick={() => handleReclassify(item._id, 'real_change')} disabled={updating} className="px-2 py-1 bg-emerald-500/20 text-emerald-500 text-[10px] font-bold rounded hover:bg-emerald-500 hover:text-white transition-colors">REAL CHANGE</button>
                         <button onClick={() => setEditingId(null)} className="px-2 py-1 text-gray-400 hover:text-white"><X size={14} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center group/edit cursor-pointer" onClick={() => setEditingId(item._id)}>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${getTypeStyle(item.changeType)}`}>
                          {item.changeType.replace('_', ' ').toUpperCase()}
                        </span>
                        <Edit2 size={12} className="ml-2 text-gray-600 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm text-gray-400 max-w-[200px] truncate" title={item.notes || item.intent}>
                      {item.notes || item.intent || '—'}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm">
                       <p className="text-white font-medium">{new Date(item.timestamp).toLocaleDateString()}</p>
                       <p className="text-gray-500 text-[10px]">{new Date(item.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center text-xs text-gray-400">
                       {item.source === 'user' ? <User size={12} className="mr-1" /> : <Calculator size={12} className="mr-1" />}
                       <span className="capitalize">{item.source}</span>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 italic text-sm">
                     No history entries found for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChangeHistory;
