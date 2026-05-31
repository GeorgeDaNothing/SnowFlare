import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bug, X, Download, Upload, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { getAllStorage, exportAllStorage, importAllStorage, setStorageKey } from '@/lib/storage';

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [rawJson, setRawJson] = useState('');
  const [editJson, setEditJson] = useState('');
  const [message, setMessage] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    refreshData();
  }, []);

  function refreshData() {
    const data = getAllStorage();
    const pretty = JSON.stringify(data, null, 2);
    setRawJson(pretty);
    setEditJson(pretty);
    setMessage('');
  }

  function handleExport() {
    const blob = new Blob([exportAllStorage()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horizon-pulse-storage-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Exported successfully');
    setTimeout(() => setMessage(''), 2000);
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = String(ev.target?.result || '');
        if (importAllStorage(text)) {
          refreshData();
          setMessage('Imported successfully');
        } else {
          setMessage('Import failed: invalid JSON');
        }
        setTimeout(() => setMessage(''), 3000);
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function handleSaveEdits() {
    try {
      const parsed = JSON.parse(editJson);
      Object.entries(parsed).forEach(([key, value]) => {
        setStorageKey(key, value);
      });
      setMessage('Saved to localStorage');
      refreshData();
    } catch {
      setMessage('Invalid JSON — not saved');
    }
    setTimeout(() => setMessage(''), 3000);
  }

  function handleReset() {
    if (confirm('Clear all local storage data? This cannot be undone.')) {
      localStorage.removeItem('hp_moves');
      localStorage.removeItem('hp_training_logs');
      localStorage.removeItem('hp_rider_profile');
      localStorage.removeItem('hp_analysis_cache');
      refreshData();
      setMessage('All storage cleared');
      setTimeout(() => setMessage(''), 3000);
    }
  }

  function toggleKey(key: string) {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[100] p-3 bg-on-surface text-surface rounded-full shadow-lg hover:scale-110 transition-transform"
        title="Debug Panel"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Bug className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-16 right-4 z-[100] w-[480px] max-h-[70vh] bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/20 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10 bg-surface-container-low">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-on-surface">Debug JSON Storage</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={handleExport} className="p-1.5 hover:bg-surface-container-high rounded-md transition-colors" title="Export">
                  <Download className="w-4 h-4 text-on-surface-variant" />
                </button>
                <button onClick={handleImport} className="p-1.5 hover:bg-surface-container-high rounded-md transition-colors" title="Import">
                  <Upload className="w-4 h-4 text-on-surface-variant" />
                </button>
                <button onClick={handleReset} className="p-1.5 hover:bg-error-container rounded-md transition-colors" title="Reset All">
                  <RotateCcw className="w-4 h-4 text-error" />
                </button>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className="px-4 py-1.5 text-xs font-medium text-center bg-primary/10 text-primary">
                {message}
              </div>
            )}

            {/* Structured View */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {Object.entries(getAllStorage()).map(([key, value]) => (
                <div key={key} className="border border-outline-variant/10 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleKey(key)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-surface-container-low hover:bg-surface-container-high transition-colors"
                  >
                    <span className="text-xs font-bold font-mono text-on-surface">{key}</span>
                    <span className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                      {Array.isArray(value) ? `${value.length} items` : typeof value === 'object' ? 'object' : String(value)}
                      {expandedKeys[key] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </span>
                  </button>
                  {expandedKeys[key] && (
                    <pre className="px-3 py-2 text-[11px] font-mono text-on-surface-variant overflow-x-auto bg-surface-container-lowest">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>

            {/* Raw Editor */}
            <div className="border-t border-outline-variant/10 p-4 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Raw Editor</label>
              <textarea
                value={editJson}
                onChange={(e) => setEditJson(e.target.value)}
                className="w-full h-32 px-3 py-2 text-[11px] font-mono bg-surface-container rounded-lg border border-outline-variant/20 focus:border-primary outline-none resize-none"
                spellCheck={false}
              />
              <button
                onClick={handleSaveEdits}
                className="w-full py-2 bg-primary text-on-primary text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Save Edits to localStorage
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
