import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { PendingPage } from './pages/PendingPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { LogsPage } from './pages/LogsPage';

function Gate({ children, requireAdmin }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted text-sm">
        Loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/pending" replace />;
  }

  if (!requireAdmin && user.role !== 'admin' && user.status !== 'approved') {
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/pending" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/pending" element={<PendingPage />} />
      <Route
        path="/dashboard"
        element={
          <Gate requireAdmin>
            <DashboardPage />
          </Gate>
        }
      />
      <Route
        path="/users"
        element={
          <Gate requireAdmin>
            <UsersPage />
          </Gate>
        }
      />
      <Route
        path="/logs"
        element={
          <Gate requireAdmin>
            <LogsPage />
          </Gate>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
