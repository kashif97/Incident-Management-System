import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import IncidentListPage from './pages/incidents/IncidentListPage';
import RaiseIncidentPage from './pages/incidents/RaiseIncidentPage';
import IncidentDetailPage from './pages/incidents/IncidentDetailPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import SlaConfigPage from './pages/admin/SlaConfigPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import CategoryManagementPage from './pages/admin/CategoryManagementPage';
import SlaMonitorPage from './pages/manager/SlaMonitorPage';
import EscalationsPage from './pages/manager/EscalationsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import ReportsPage from './pages/reports/ReportsPage';
import ProfilePage from './pages/profile/ProfilePage';

function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.roleCode)) return <Navigate to="/app/dashboard" replace />;
  return children;
}

function NotFound() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:12, color:'var(--text-m)' }}>
      <div style={{ fontSize:56 }}>🔍</div>
      <h2 style={{ fontSize:22, fontWeight:700, color:'var(--text)' }}>Page not found</h2>
      <p style={{ fontSize:14 }}>The page you're looking for doesn't exist.</p>
      <a href="/app/dashboard" style={{ color:'var(--primary)', fontWeight:600 }}>← Back to Dashboard</a>
    </div>
  );
}

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/app/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RootRedirect />} />

      <Route path="/app" element={
        <PrivateRoute>
          <AppLayout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Incident routes */}
        <Route path="incidents" element={
          <PrivateRoute roles={['RESOLVER', 'INC_MANAGER', 'ADMIN']}>
            <IncidentListPage />
          </PrivateRoute>
        } />
        <Route path="incidents/my" element={<IncidentListPage myOnly={true} />} />
        <Route path="incidents/new" element={
          <PrivateRoute roles={['REPORTER']}>
            <RaiseIncidentPage />
          </PrivateRoute>
        } />
        <Route path="incidents/:id" element={<IncidentDetailPage />} />

        {/* Admin routes */}
        <Route path="admin/users" element={
          <PrivateRoute roles={['ADMIN']}>
            <UserManagementPage />
          </PrivateRoute>
        } />
        <Route path="admin/slas" element={
          <PrivateRoute roles={['ADMIN']}>
            <SlaConfigPage />
          </PrivateRoute>
        } />
        <Route path="admin/audit" element={
          <PrivateRoute roles={['ADMIN']}>
            <AuditLogsPage />
          </PrivateRoute>
        } />
        {/* NEW: Category Management */}
        <Route path="admin/categories" element={
          <PrivateRoute roles={['ADMIN', 'INC_MANAGER']}>
            <CategoryManagementPage />
          </PrivateRoute>
        } />

        {/* Manager routes */}
        <Route path="manager/sla" element={
          <PrivateRoute roles={['INC_MANAGER', 'ADMIN']}>
            <SlaMonitorPage />
          </PrivateRoute>
        } />
        <Route path="manager/escalations" element={
          <PrivateRoute roles={['INC_MANAGER', 'ADMIN']}>
            <EscalationsPage />
          </PrivateRoute>
        } />

        {/* Reports — accessible to ADMIN, INC_MANAGER, RESOLVER */}
        <Route path="reports" element={
          <PrivateRoute roles={['ADMIN', 'INC_MANAGER', 'RESOLVER']}>
            <ReportsPage />
          </PrivateRoute>
        } />

        {/* Notifications */}
        <Route path="notifications" element={<NotificationsPage />} />

        {/* Profile — accessible to all roles */}
        <Route path="profile" element={<ProfilePage />} />

        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
