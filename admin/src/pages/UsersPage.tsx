import { useEffect, useState } from 'react';
import { api, type User } from '../lib/api';
import { AppShell } from '../components/AppShell';
import { StatusDot } from '../components/StatusDot';

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<User[]>('/users').then(({ data }) => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold tracking-tight mb-1">
        All Users
      </h1>
      <p className="text-sm text-muted mb-8">
        Every account that has ever signed in, regardless of status.
      </p>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-panel border-b border-border text-left text-xs text-muted uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Telegram</th>
                <th className="px-5 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-border last:border-0 hover:bg-panel/50">
                  <td className="px-5 py-3">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-muted">{u.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <StatusDot status={u.status} />
                  </td>
                  <td className="px-5 py-3 text-muted">{u.location?.name ?? '—'}</td>
                  <td className="px-5 py-3">
                    {u.telegramChatId ? (
                      <span className="text-cyan text-xs">Linked</span>
                    ) : (
                      <span className="text-muted text-xs">Not linked</span>
                    )}
                  </td>
                  <td className="px-5 py-3 capitalize text-muted">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
