'use client';

import { useEffect, useState } from 'react';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'SUCCESS';
  service: string;
  message: string;
  data?: any;
  error?: string;
}

export default function DebugPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/debug/logs');
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const clearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all logs?')) return;

    try {
      setLoading(true);
      await fetch('/api/debug/logs', { method: 'DELETE' });
      setLogs([]);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    if (!autoRefresh) return;

    const interval = setInterval(fetchLogs, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getLogColor = (level: string) => {
    switch (level) {
      case 'INFO': return 'text-blue-400';
      case 'WARN': return 'text-yellow-400';
      case 'ERROR': return 'text-red-400';
      case 'DEBUG': return 'text-purple-400';
      case 'SUCCESS': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getLogEmoji = (level: string) => {
    switch (level) {
      case 'INFO': return 'ℹ️';
      case 'WARN': return '⚠️';
      case 'ERROR': return '❌';
      case 'DEBUG': return '🐛';
      case 'SUCCESS': return '✅';
      default: return '📝';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Debug Logs</h1>
          <p className="text-gray-400">Real-time logging for media upload and analysis</p>
        </div>

        <div className="mb-6 flex gap-4 items-center flex-wrap">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium disabled:opacity-50 transition"
          >
            Refresh Logs
          </button>

          <button
            onClick={clearLogs}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium disabled:opacity-50 transition"
          >
            Clear Logs
          </button>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Auto-refresh every 2s</span>
          </label>

          <span className="text-sm text-gray-400">
            Total Logs: <span className="font-bold text-white">{logs.length}</span>
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No logs yet. Upload a file to see logs here.
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="border-b border-slate-700 p-3 hover:bg-slate-800 transition last:border-b-0"
                >
                  <div className={`flex items-start gap-3 ${getLogColor(log.level)}`}>
                    <span>{getLogEmoji(log.level)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-2 flex-wrap items-center">
                        <span className="text-gray-500 text-xs">[{log.timestamp}]</span>
                        <span className="font-bold">{log.service}</span>
                        <span>{log.message}</span>
                      </div>

                      {log.data && (
                        <div className="mt-1 text-xs text-gray-400 bg-slate-800 p-2 rounded mt-2">
                          <div>Data: {JSON.stringify(log.data, null, 2)}</div>
                        </div>
                      )}

                      {log.error && (
                        <div className="mt-1 text-xs text-red-300 bg-red-900 bg-opacity-20 p-2 rounded mt-2">
                          <div>Error: {log.error}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg text-sm">
          <p className="font-bold mb-2">📋 How to Use:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-200">
            <li>Go back to the main page and upload a media file</li>
            <li>Watch logs appear in real-time as the system processes your request</li>
            <li>Logs show: Media processing → Gemini analysis → Database storage</li>
            <li>Each service logs its entry, success/error, and any relevant data</li>
            <li>Use this to identify exactly where failures occur</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
