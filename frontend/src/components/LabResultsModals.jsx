import React, { useState } from 'react';
import { 
  X, Droplets, FlaskConical, Calendar, 
  ChevronRight, RefreshCw, Upload, FileText,
  AlertCircle, CheckCircle2, Search
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const LabResultsModals = ({ isOpen, onClose, onSave, clerkId }) => {
  const [formData, setFormData] = useState({
    testName: '',
    resultValue: '',
    unit: '',
    referenceRange: '',
    sampleDate: new Date().toISOString().split('T')[0],
    source: 'manual'
  });
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [reportUrl, setReportUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [extractedTests, setExtractedTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [showExtraction, setShowExtraction] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setExtracting(true);
    const data = new FormData();
    data.append('report', file);

    try {
      console.log('[Lab Upload] Extracting data from:', file.name);
      const res = await axios.post(`${API_URL}/lab-results/extract`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.status === 'success') {
        console.log('[Lab Upload] Extracted', res.data.data.totalTests, 'tests');
        setExtractedTests(res.data.data.tests);
        setSelectedTests(res.data.data.tests.map((_, idx) => idx)); // Select all by default
        setShowExtraction(true);
      }
    } catch (err) {
      console.error('[Lab Upload] Extraction failed:', err);
      if (err.response?.data?.fallback === 'manual') {
        alert('AI extraction unavailable. Please enter lab results manually.');
      } else {
        alert('Failed to extract data. Please try again or enter manually.');
      }
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.post(`${API_URL}/lab-results`, {
        ...formData,
        clerkId,
        reportRef: reportUrl,
        resultValue: parseFloat(formData.resultValue)
      });
      if (res.data.status === 'success') {
        onSave();
        onClose();
        setFormData({
            testName: '', resultValue: '', unit: '',
            referenceRange: '', sampleDate: new Date().toISOString().split('T')[0],
            source: 'manual'
        });
        setReportUrl(null);
      }
    } catch (err) {
      console.error("Save lab result failed", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveExtracted = async () => {
    if (selectedTests.length === 0) {
      alert('Please select at least one test to save.');
      return;
    }

    setSaving(true);
    try {
      const testsToSave = selectedTests.map(idx => ({
        ...extractedTests[idx],
        clerkId
      }));

      // Save all selected tests
      const savePromises = testsToSave.map(test => 
        axios.post(`${API_URL}/lab-results`, test)
      );

      await Promise.all(savePromises);
      console.log('[Lab Save] Saved', testsToSave.length, 'tests');
      
      onSave();
      onClose();
      setExtractedTests([]);
      setSelectedTests([]);
      setShowExtraction(false);
    } catch (err) {
      console.error('[Lab Save] Failed to save extracted tests:', err);
      alert('Failed to save some tests. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleTestSelection = (idx) => {
    setSelectedTests(prev => 
      prev.includes(idx) 
        ? prev.filter(i => i !== idx)
        : [...prev, idx]
    );
  };

  const selectAllTests = () => {
    setSelectedTests(extractedTests.map((_, idx) => idx));
  };

  const deselectAllTests = () => {
    setSelectedTests([]);
  };

  const commonTests = [
    { name: 'Hemoglobin', unit: 'g/dL', range: '13.5-17.5' },
    { name: 'Glucose (Fasting)', unit: 'mg/dL', range: '70-100' },
    { name: 'Total Cholesterol', unit: 'mg/dL', range: '< 200' },
    { name: 'TSH', unit: 'mIU/L', range: '0.4-4.0' },
    { name: 'Creatinine', unit: 'mg/dL', range: '0.7-1.3' }
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2.5rem] w-full max-w-4xl shadow-2xl relative overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500">
        
        <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <FlaskConical className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                {showExtraction ? 'Review Extracted Lab Results' : 'Log Laboratory Result'}
              </h3>
              <p className="text-[10px] text-gray-600 dark:text-gray-300 font-bold uppercase tracking-widest">
                {showExtraction ? `${extractedTests.length} tests found - Select & Save` : 'Entry Protocol Alpha-7'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
          {showExtraction ? (
            /* Extraction Results View */
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
                  Extracted Tests ({selectedTests.length}/{extractedTests.length} selected)
                </h4>
                <div className="flex gap-2">
                  <button 
                    onClick={selectAllTests}
                    className="px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-500/20 transition-all"
                  >
                    Select All
                  </button>
                  <button 
                    onClick={deselectAllTests}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-[10px] font-black uppercase hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {extractedTests.map((test, idx) => {
                  const isSelected = selectedTests.includes(idx);
                  
                  // Determine if value is in range
                  const isInRange = (() => {
                    if (!test.referenceRange || typeof test.resultValue !== 'number') return null;
                    const range = test.referenceRange.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
                    if (range) {
                      const val = test.resultValue;
                      const min = parseFloat(range[1]);
                      const max = parseFloat(range[2]);
                      return val >= min && val <= max;
                    }
                    return null;
                  })();

                  const statusColor = isInRange === true 
                    ? 'border-emerald-500/30 bg-emerald-500/5' 
                    : isInRange === false 
                      ? 'border-red-500/30 bg-red-500/5' 
                      : 'border-gray-200 dark:border-gray-700';

                  return (
                    <div
                      key={idx}
                      onClick={() => toggleTestSelection(idx)}
                      className={`p-6 border-2 rounded-2xl cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-500/5 shadow-lg' 
                          : statusColor
                      } hover:border-emerald-500/50`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-emerald-500 border-emerald-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                          <div className="flex-1">
                            <h5 className="text-base font-black text-gray-900 dark:text-white mb-2">
                              {test.testName}
                            </h5>
                            <div className="flex items-center gap-6">
                              <div>
                                <div className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-1">Result</div>
                                <div className={`text-2xl font-black ${
                                  isInRange === true ? 'text-emerald-500' : 
                                  isInRange === false ? 'text-red-500' : 'text-gray-900 dark:text-white'
                                }`}>
                                  {test.resultValue} {test.unit && <span className="text-sm font-bold text-gray-500">{test.unit}</span>}
                                </div>
                              </div>
                              {test.referenceRange && (
                                <div>
                                  <div className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-1">Reference</div>
                                  <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{test.referenceRange} {test.unit}</div>
                                </div>
                              )}
                              {isInRange !== null && (
                                <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                  isInRange 
                                    ? 'bg-emerald-500/10 text-emerald-600' 
                                    : 'bg-red-500/10 text-red-600'
                                }`}>
                                  {isInRange ? '✓ Normal' : '⚠ Abnormal'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Manual Entry View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 mb-2 tracking-widest">Test Identification</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.testName}
                      placeholder="e.g. Hemoglobin, TSH..."
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                      onChange={(e) => setFormData({...formData, testName: e.target.value})}
                    />
                    <Search className="absolute right-4 top-4 w-4 h-4 text-gray-700 dark:text-gray-300" />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {commonTests.map(t => (
                      <button 
                        key={t.name}
                        onClick={() => setFormData({...formData, testName: t.name, unit: t.unit, referenceRange: t.range})}
                        className="px-3 py-1.5 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-lg text-[9px] font-black text-gray-700 dark:text-gray-300 hover:text-emerald-500 hover:border-emerald-500/30 transition-all uppercase tracking-tighter"
                      >
                        + {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 mb-2 tracking-widest">Result Value</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-sm text-gray-900 dark:text-white outline-none"
                      onChange={(e) => setFormData({...formData, resultValue: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 mb-2 tracking-widest">Unit</label>
                    <input 
                      type="text" 
                      value={formData.unit}
                      placeholder="g/dL"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-sm text-gray-900 dark:text-white outline-none"
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 mb-2 tracking-widest">Reference Range</label>
                  <input 
                    type="text" 
                    value={formData.referenceRange}
                    placeholder="e.g. 13.5 - 17.5"
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-sm text-gray-900 dark:text-white outline-none"
                    onChange={(e) => setFormData({...formData, referenceRange: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 mb-2 tracking-widest">Collection Date</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={formData.sampleDate}
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-sm text-gray-900 dark:text-white outline-none"
                      onChange={(e) => setFormData({...formData, sampleDate: e.target.value})}
                    />
                    <Calendar className="absolute right-4 top-4 w-4 h-4 text-gray-700 dark:text-gray-300" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 mb-2 tracking-widest">Digital Report Backup</label>
                  <div className="border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl p-8 text-center hover:border-emerald-500/30 transition-all group">
                    {reportUrl ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl">
                          <FileText className="w-8 h-8 text-emerald-500" />
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 uppercase">Report Linked Successfully</span>
                        <button onClick={() => setReportUrl(null)} className="text-[9px] text-gray-700 dark:text-gray-300 hover:text-red-500 font-bold uppercase underline">Remove File</button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl group-hover:scale-110 transition-transform">
                          {extracting ? <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" /> : <Upload className="w-8 h-8 text-gray-600 dark:text-gray-300" />}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">Upload Lab Report</p>
                          <p className="text-[9px] text-gray-600 dark:text-gray-300 font-bold uppercase tracking-widest">PDF or Image • AI Extraction</p>
                        </div>
                        <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFileUpload} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-gray-50 dark:bg-gray-950/50 border-t border-gray-100 dark:border-gray-800">
           {showExtraction ? (
             <div className="flex gap-4">
               <button 
                 onClick={() => {
                   setShowExtraction(false);
                   setExtractedTests([]);
                   setSelectedTests([]);
                 }}
                 className="flex-1 py-5 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] uppercase tracking-[0.2em] text-xs"
               >
                 <X className="w-5 h-5" />
                 Manual Entry
               </button>
               <button 
                 onClick={handleSaveExtracted}
                 disabled={saving || selectedTests.length === 0}
                 className="flex-1 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-30 uppercase tracking-[0.2em] text-xs"
               >
                 {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                 Save Selected ({selectedTests.length})
               </button>
             </div>
           ) : (
             <button 
               onClick={handleSave}
               disabled={saving || !formData.testName || !formData.resultValue}
               className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-30 uppercase tracking-[0.2em] text-xs"
             >
               {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
               Commit to Diagnostic Record
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default LabResultsModals;
