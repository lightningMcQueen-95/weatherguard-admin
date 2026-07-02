import { useEffect, useState } from 'react';
import { api, type User } from '../lib/api';
import { AppShell } from '../components/AppShell';
import { StatusDot } from '../components/StatusDot';

export function DashboardPage() {
  const [pending, setPending] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);

  async function load() {
    const { data } = await api.get<User[]>('/users/pending');
    setPending(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, status: 'approved' | 'rejected') {
    setActingOn(id);
    try {
      await api.patch(`/users/${id}/status`, { status });
      setPending((prev) => prev.filter((u) => u._id !== id));
    } finally {
      setActingOn(null);
    }
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Pending Requests
          </h1>
          <p className="text-sm text-muted mt-1">
            New sign-ups wait here until you approve them. Nothing is sent to
            Telegram until a request moves to Approved.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="h-2 w-2 rounded-full bg-amber status-pulse" />
          {pending.length} waiting
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : pending.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg py-16 text-center">
          <p className="text-sm text-muted">No pending requests right now.</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-panel border-b border-border text-left text-xs text-muted uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Provider</th>
                <th className="px-5 py-3 font-medium">Requested</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((u) => (
                <tr key={u._id} className="border-b border-border last:border-0 hover:bg-panel/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} className="h-7 w-7 rounded-full" />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-border" />
                      )}
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 capitalize text-muted">{u.provider}</td>
                  <td className="px-5 py-3 text-muted">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <StatusDot status={u.status} />
                  </td>
                  <td className="px-5 py-3 text-right space-x-2">
                    <button
                      disabled={actingOn === u._id}
                      onClick={() => act(u._id, 'approved')}
                      className="rounded-md bg-cyan/10 text-cyan px-3 py-1.5 text-xs font-medium hover:bg-cyan/20 transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      disabled={actingOn === u._id}
                      onClick={() => act(u._id, 'rejected')}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-red hover:border-red/40 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
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
