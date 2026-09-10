import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import { authHeaders } from '../utils/authHeaders';

// Modular Lab Components
import LabHeader from '../components/lab/LabHeader';
import LabMetricStrip, { LAB_TABS } from '../components/lab/LabMetricStrip';
import LabSearchBar from '../components/lab/LabSearchBar';
import ResultModal from '../components/lab/ResultModal';
import VersionHistoryModal from '../components/lab/VersionHistoryModal';

// Modular Lab Sub-Pages
import LabHome from './lab/LabHome';
import LabQueue from './lab/LabQueue';
import LabOrders from './lab/LabOrders';
import LabResults from './lab/LabResults';
import LabCritical from './lab/LabCritical';
import LabFollowUps from './lab/LabFollowUps';

const HEADERS = authHeaders('lab');

export default function LabDashboard({ initialTab = 'todays_samples' }) {
  const [ordersList, setOrdersList] = useState([]);
  const [counts, setCounts]         = useState({
    todaysSamples: 0, pending: 0, inProgress: 0, completed: 0, verified: 0, criticalAttention: 0, followUpRequired: 0
  });
  const [tab, setTab]               = useState(initialTab);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [busy, setBusy]             = useState(null);
  const [resultModal, setResultModal] = useState(null);
  const [versionModal, setVersionModal] = useState(null);
  const [search, setSearch]         = useState('');

  // Rapid QR/Token Scan Input (§28)
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [scanning, setScanning]       = useState(false);
  const [scanMessage, setScanMessage] = useState(null);

  // Map prop changes to internal tab state
  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  const fetchAll = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true); else setRefreshing(true);
    try {
      const [pRes, cRes] = await Promise.allSettled([
        axios.get(`${API_URL}/lab/pending`, { headers: HEADERS }),
        axios.get(`${API_URL}/lab/dashboard-counts`, { headers: HEADERS })
      ]);

      let items = [];
      if (pRes.status === 'fulfilled') items = pRes.value.data.data || [];
      setOrdersList(items);

      if (cRes.status === 'fulfilled') {
        const d = cRes.value.data.data || {};
        setCounts({
          todaysSamples: d.todaysSamples || items.length,
          pending: items.filter(o => o.status === 'ordered' || o.status === 'scanned' || o.status === 'queued').length,
          inProgress: items.filter(o => o.status === 'collected' || o.status === 'processing').length,
          completed: items.filter(o => o.status === 'resulted').length,
          verified: items.filter(o => o.status === 'verified').length,
          criticalAttention: items.filter(o => o.critical || o.urgency === 'stat' || o.priority === 'stat').length,
          followUpRequired: d.followUpRequired || items.filter(o => o.status === 'verified' || o.status === 'resulted').length
        });
      }
      setLastRefresh(new Date());
    } catch (e) {
      console.error('[Lab] Fetch error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const interval = setInterval(() => fetchAll(true), 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // State Transitions
  const transition = async (order, body, label) => {
    setBusy(order.orderId || order._id);
    try {
      await axios.patch(
        `${API_URL}/lab/orders/${order.sessionId || order._id}/${order.orderId || order._id}/status`,
        body,
        { headers: HEADERS }
      );
      await fetchAll(true);
    } catch (e) {
      console.error(`[Lab] ${label} error:`, e.message);
    } finally {
      setBusy(null);
    }
  };

  const markCollected = (order) =>
    transition(order, { status: 'collected', labTechnicianId: HEADERS['X-User-Role'] || 'lab' }, 'collected');

  const verifyResult = async (order) => {
    setBusy(order.orderId || order._id);
    try {
      await axios.post(
        `${API_URL}/lab/results/${order.orderId || order._id}/verify`,
        { supervisorId: 'LAB-SUPERVISOR-01' },
        { headers: HEADERS }
      ).catch(() => transition(order, { status: 'verified', labTechnicianId: 'lab' }, 'verified'));

      await fetchAll(true);
    } catch (e) {
      console.error('[Lab] Verify error:', e.message);
    } finally {
      setBusy(null);
    }
  };

  const saveResult = async (payload) => {
    const order = resultModal;
    try {
      await axios.post(
        `${API_URL}/lab/results/entry`,
        {
          investigationOrderId: order.orderId || order._id,
          patientId: order.patientId,
          testName: order.testName,
          resultValue: payload.value,
          unit: payload.unit,
          referenceRange: payload.referenceRange,
          critical: payload.critical,
          technicianId: 'lab'
        },
        { headers: HEADERS }
      ).catch(() => transition(order, { status: 'resulted', result: payload }, 'resulted'));

      setResultModal(null);
      await fetchAll(true);
    } catch (e) {
      console.error('[Lab] Save result error:', e.message);
    }
  };

  const handleQrScan = async (e) => {
    e?.preventDefault();
    if (!qrCodeInput.trim()) return;
    setScanning(true);
    setScanMessage(null);
    try {
      const res = await axios.post(`${API_URL}/lab/scan-qr`, { code: qrCodeInput });
      if (res.data.status === 'success') {
        setScanMessage({ type: 'success', text: res.data.message });
        setQrCodeInput('');
        fetchAll(true);
      }
    } catch (err) {
      setScanMessage({ type: 'error', text: err.response?.data?.message || 'QR code resolution failed.' });
    } finally {
      setScanning(false);
    }
  };

  // Search filtering
  const searchFilteredOrders = ordersList.filter(o =>
    !search ||
    (o.patientName || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.testName || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.tokenNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-cyan-500/30 border-t-cyan-500 animate-spin" />
          <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Loading AIIA Lab Operational Workbench...</p>
        </div>
      </div>
    );
  }

  const currentTabObj = LAB_TABS.find(t => t.key === tab) || LAB_TABS[0];

  const renderActiveView = () => {
    const props = {
      orders: searchFilteredOrders,
      busy,
      onMarkCollected: markCollected,
      onEnterResult: (order) => setResultModal(order),
      onVerifyResult: verifyResult,
      onViewHistory: (order) => setVersionModal(order)
    };

    switch (tab) {
      case 'todays_samples':
        return <LabHome {...props} />;
      case 'pending':
        return <LabQueue {...props} />;
      case 'in_progress':
        return <LabOrders {...props} />;
      case 'completed':
        return <LabResults {...props} filterMode="completed" />;
      case 'verified':
        return <LabResults {...props} filterMode="verified" />;
      case 'critical':
        return <LabCritical {...props} />;
      case 'followup':
        return <LabFollowUps {...props} />;
      default:
        return <LabHome {...props} />;
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-6 animate-in fade-in duration-300">
      {/* ── HEADER ── */}
      <LabHeader
        lastRefresh={lastRefresh}
        qrCodeInput={qrCodeInput}
        setQrCodeInput={setQrCodeInput}
        scanning={scanning}
        scanMessage={scanMessage}
        onQrScan={handleQrScan}
      />

      {/* ── 7-TAB OPERATIONAL METRIC STRIP ── */}
      <LabMetricStrip
        activeTab={tab}
        counts={counts}
        onTabSelect={(newTabKey) => setTab(newTabKey)}
      />

      {/* ── SEARCH & BAR ── */}
      <LabSearchBar
        currentLabel={currentTabObj.label}
        itemCount={searchFilteredOrders.length}
        search={search}
        setSearch={setSearch}
        onRefresh={() => fetchAll(true)}
        refreshing={refreshing}
      />

      {/* ── ACTIVE TAB MODULAR VIEW ── */}
      {renderActiveView()}

      {/* RESULT MODAL */}
      {resultModal && (
        <ResultModal order={resultModal} onClose={() => setResultModal(null)} onSave={saveResult} />
      )}

      {/* VERSION HISTORY MODAL (§30 Audit Log) */}
      {versionModal && (
        <VersionHistoryModal order={versionModal} onClose={() => setVersionModal(null)} />
      )}
    </div>
  );
}
