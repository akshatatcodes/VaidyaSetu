import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { API_URL } from '../config/api';

/** Waiting-room live queue + optional audio announcement */
export default function QueueDisplay({ department: departmentProp }) {
  const params = useParams();
  const department = departmentProp || params.department || 'Kayachikitsa';
  const [board, setBoard] = useState(null);
  const lastAnnounce = useRef('');

  const load = async () => {
    try {
      const res = await axios.get(`${API_URL}/kiosk/queue/${encodeURIComponent(department)}`);
      setBoard(res.data);
      const ann = res.data?.announcement;
      if (ann && ann !== lastAnnounce.current && 'speechSynthesis' in window) {
        lastAnnounce.current = ann;
        const u = new SpeechSynthesisUtterance(ann);
        window.speechSynthesis.speak(u);
      }
    } catch (e) {
      console.warn('Queue board error', e.message);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [department]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-2">AIIA OPD Queue — {department}</h1>
      <p className="text-teal-300 mb-8 text-lg">
        Now serving:{' '}
        <span className="text-4xl font-black text-white">
          {board?.nowServing?.tokenNumber || '—'}
        </span>
      </p>
      <div className="grid gap-2 max-w-lg">
        {(board?.data || []).slice(0, 12).map((row) => (
          <div
            key={row.tokenNumber}
            className={`flex justify-between px-4 py-3 rounded-xl border ${
              row.triagePriority === 'emergency'
                ? 'border-rose-500 bg-rose-500/20'
                : row.triagePriority === 'urgent'
                  ? 'border-orange-400 bg-orange-500/10'
                  : 'border-white/10 bg-white/5'
            }`}
          >
            <span className="font-mono font-bold">{row.tokenNumber}</span>
            <span className="text-sm text-slate-300">{row.queueStatus}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
