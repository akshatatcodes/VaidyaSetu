import React, { useState } from 'react';
import {
  FlaskConical, CheckCircle2, Clock, Eye, Filter, Search,
  ArrowRight, ShieldCheck, FileText, Check, AlertCircle, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DoctorLabs() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all'); // all | pending | ready | signed
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [signedSuccessNotice, setSignedSuccessNotice] = useState('');

  const [labOrders, setLabOrders] = useState([
    {
      id: 'ORD-101',
      tokenNumber: 'OPD-001',
      patientName: 'Rajesh Sharma',
      age: 52,
      gender: 'Male',
      testName: 'Complete Blood Count (CBC)',
      section: 'Hematology',
      priority: 'urgent',
      status: 'verified',
      stage: 'Verified & Ready',
      orderedAt: '10:15 AM Today',
      results: [
        { parameter: 'Hemoglobin (Hb)', value: '11.8', unit: 'g/dL', range: '13.0 - 17.0', status: 'low' },
        { parameter: 'Total WBC Count', value: '8,400', unit: '/mm3', range: '4,000 - 11,000', status: 'normal' },
        { parameter: 'Platelet Count', value: '2.4', unit: 'Lakhs/mm3', range: '1.5 - 4.5', status: 'normal' }
      ]
    },
    {
      id: 'ORD-102',
      tokenNumber: 'OPD-002',
      patientName: 'Sunita Devi',
      age: 61,
      gender: 'Female',
      testName: 'Liver Function Test (LFT)',
      section: 'Biochemistry',
      priority: 'routine',
      status: 'processing',
      stage: 'Processing',
      orderedAt: '10:45 AM Today',
      results: []
    },
    {
      id: 'ORD-103',
      tokenNumber: 'OPD-003',
      patientName: 'Amit Verma',
      age: 34,
      gender: 'Male',
      testName: 'Chest X-Ray (PA View)',
      section: 'Radiology',
      priority: 'stat',
      status: 'verified',
      stage: 'Doctor review',
      orderedAt: '09:30 AM Today',
      results: [
        { parameter: 'Impression', value: 'Mild tracheobronchial thickening. Sclera & lung fields clear.', unit: '', range: 'Normal', status: 'normal' }
      ]
    }
  ]);

  const handleSignOffOrder = (orderId) => {
    setLabOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'signed', stage: 'Reviewed & Signed' } : o));
    setIsResultModalOpen(false);
    setSignedSuccessNotice(`Lab result ${orderId} successfully reviewed and digitally signed!`);
    setTimeout(() => setSignedSuccessNotice(''), 4000);
  };

  const filteredOrders = labOrders.filter((order) => {
    const matchesSearch =
      order.patientName.toLowerCase().includes(search.toLowerCase()) ||
      order.tokenNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.testName.toLowerCase().includes(search.toLowerCase());

    if (activeTab === 'pending') return matchesSearch && order.status !== 'verified' && order.status !== 'signed';
    if (activeTab === 'ready') return matchesSearch && order.status === 'verified';
    if (activeTab === 'signed') return matchesSearch && order.status === 'signed';
    return matchesSearch;
  });

  const workflowStages = [
    'Ordered',
    'Sample collected',
    'Processing',
    'Verified',
    'Doctor review',
    'Follow-up'
  ];

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[11px] font-black uppercase tracking-wider">
              🧪 CLINICAL INVESTIGATIONS & LAB WORKBENCH
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Doctor Lab Orders & Results
          </h1>
          <p className="text-xs text-teal-200/70 font-medium mt-1">
            Track diagnostic sample stages, review verified test reports, and issue lab follow-up actions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className="px-4 py-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-2 cursor-pointer"
          >
            <Clock className="w-4 h-4" /> Pending ({labOrders.filter(o => o.status !== 'verified' && o.status !== 'signed').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ready')}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" /> Ready for Review ({labOrders.filter(o => o.status === 'verified').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signed')}
            className="px-4 py-2.5 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold text-xs flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-teal-400" /> Signed ({labOrders.filter(o => o.status === 'signed').length})
          </button>
        </div>
      </div>

      {signedSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center gap-2 shadow-lg animate-in slide-in-from-top duration-300">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>{signedSuccessNotice}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 text-xs font-bold">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'pending', label: 'Processing Pending' },
            { id: 'ready', label: 'Ready for Review' },
            { id: 'signed', label: 'Reviewed & Signed' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-black ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, token, test name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Interactive Workflow Lifecycle Bar */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white border border-teal-500/30 shadow-xl space-y-3">
        <span className="text-[11px] font-black uppercase tracking-wider text-teal-400 block">
          End-to-End Diagnostic Stage Lifecycle Workflow
        </span>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
          {workflowStages.map((stage, idx) => (
            <React.Fragment key={idx}>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15">
                <span className="w-5 h-5 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center font-mono font-black text-[10px]">
                  {idx + 1}
                </span>
                <span>{stage}</span>
              </div>
              {idx < workflowStages.length - 1 && (
                <ArrowRight className="w-4 h-4 text-teal-500/60 hidden sm:block" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Orders Roster */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOrders.map((order) => {
          const isVerified = order.status === 'verified';
          return (
            <div
              key={order.id}
              className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {order.tokenNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isVerified
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {order.stage}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {order.patientName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {order.age}y • {order.gender} • Ordered: {order.orderedAt}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold">
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">Test Ordered</span>
                  <span className="text-slate-900 dark:text-white font-black block mt-0.5">
                    {order.testName}
                  </span>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">
                    Section: {order.section}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrder(order);
                    setIsResultModalOpen(true);
                  }}
                  className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                    isVerified
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-white/10 hover:bg-slate-300 text-slate-800 dark:text-white'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>{isVerified ? 'Review Result & Sign' : 'View Order Details'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Result Review Modal */}
      {isResultModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-emerald-500/30 text-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {selectedOrder.tokenNumber} • {selectedOrder.id}
                </span>
                <h3 className="text-xl font-black text-white">{selectedOrder.patientName}</h3>
                <p className="text-xs text-gray-400">{selectedOrder.testName} ({selectedOrder.section})</p>
              </div>
              <button
                type="button"
                onClick={() => setIsResultModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300"
              >
                ✕
              </button>
            </div>

            {/* Results Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Verified Laboratory Parameters
              </h4>
              {selectedOrder.results.length > 0 ? (
                <div className="space-y-2">
                  {selectedOrder.results.map((res, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-between text-xs font-semibold"
                    >
                      <div>
                        <span className="text-white block font-bold">{res.parameter}</span>
                        <span className="text-[10px] text-gray-400">Range: {res.range}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-black font-mono ${res.status === 'low' ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {res.value} {res.unit}
                        </span>
                        {res.status === 'low' && (
                          <span className="block text-[10px] text-amber-400 font-bold">L (Below Ref Range)</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-800 text-center text-xs text-gray-400">
                  Sample in processing stage. Diagnostic lab technician verification pending.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsResultModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-xs text-white cursor-pointer"
              >
                Close Window
              </button>
              {selectedOrder.status !== 'signed' && (
                <button
                  type="button"
                  onClick={() => handleSignOffOrder(selectedOrder.id)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4" /> Sign Off Lab Result & Move to Signed
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  handleSignOffOrder(selectedOrder.id);
                  navigate('/doctor/followups');
                }}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-xs text-white flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Check className="w-4 h-4" /> Sign & Schedule Patient Follow-Up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
