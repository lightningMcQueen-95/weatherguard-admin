import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { AppShell } from '../components/AppShell';

interface AlertLogEntry {
  _id: string;
  userId: { name: string; email: string } | null;
  status: 'sent' | 'failed';
  error?: string;
  createdAt: string;
}

export function LogsPage() {
  const [logs, setLogs] = useState<AlertLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  async function load() {
    const { data } = await api.get<AlertLogEntry[]>('/alerts/logs');
    setLogs(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function runNow() {
    setTriggering(true);
    try {
      await api.post('/alerts/run-now');
      setTimeout(load, 1500);
    } finally {
      setTriggering(false);
    }
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Alert Logs</h1>
          <p className="text-sm text-muted mt-1">
            Every alert sweep checks for approved, Telegram-linked users only.
          </p>
        </div>
        <button
          onClick={runNow}
          disabled={triggering}
          className="rounded-md bg-cyan/10 text-cyan px-4 py-2 text-sm font-medium hover:bg-cyan/20 transition-colors disabled:opacity-50"
        >
          {triggering ? 'Running…' : 'Run sweep now'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : logs.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg py-16 text-center">
          <p className="text-sm text-muted">No alerts sent yet.</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-panel border-b border-border text-left text-xs text-muted uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Result</th>
                <th className="px-5 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3">{log.userId?.name ?? 'Unknown user'}</td>
                  <td className="px-5 py-3">
                    <span className={log.status === 'sent' ? 'text-cyan' : 'text-red'}>
                      {log.status === 'sent' ? 'Sent' : `Failed — ${log.error}`}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
