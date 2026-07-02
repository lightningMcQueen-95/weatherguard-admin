import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Pending Requests' },
  { to: '/users', label: 'All Users' },
  { to: '/logs', label: 'Alert Logs' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-border bg-panel flex flex-col">
        <div className="px-6 py-6 border-b border-border">
          <h1 className="font-display text-lg font-semibold tracking-tight text-text">
            WeatherGuard
          </h1>
          <p className="text-xs text-muted mt-0.5">Admin Console</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }: { isActive: boolean }) =>
                `block rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-cyan/10 text-cyan font-medium'
                    : 'text-muted hover:bg-border/50 hover:text-text'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-border flex items-center justify-center text-xs">
                {user?.name?.[0] ?? '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm truncate">{user?.name}</p>
              <p className="text-xs text-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-sm text-muted hover:text-red transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 px-10 py-8 overflow-y-auto">{children}</main>
    </div>
  );
}
