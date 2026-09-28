import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export default function ProtectedRoute({ allowedRoles = null }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#090d16',
        color: '#e2e8f0',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <ShieldCheck style={{ width: 48, height: 48, color: '#38bdf8', marginBottom: 16, animation: 'pulse 1.5s infinite' }} />
        <p style={{ fontSize: '0.95rem', letterSpacing: '0.05em', color: '#94a3b8' }}>
          VERIFYING LAW ENFORCEMENT CREDENTIALS...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && user) {
    const userRole = user.role ? user.role.toUpperCase() : '';
    const rolesList = Array.isArray(allowedRoles) ? allowedRoles.map(r => r.toUpperCase()) : [allowedRoles.toUpperCase()];

    if (!rolesList.includes(userRole)) {
      return (
        <div style={{
          padding: '40px',
          maxWidth: 600,
          margin: '80px auto',
          background: '#0f172a',
          border: '1px solid #dc2626',
          borderRadius: 8,
          color: '#f8fafc',
          textAlign: 'center'
        }}>
          <ShieldAlert style={{ width: 48, height: 48, color: '#ef4444', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 8 }}>Restricted Access Zone</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 16 }}>
            Your current assigned role ({user.role}) is not authorized to access this supervisory or administrative module.
          </p>
          <a href="/dashboard" style={{
            display: 'inline-block',
            padding: '8px 16px',
            background: '#1e293b',
            color: '#38bdf8',
            borderRadius: 4,
            textDecoration: 'none',
            fontSize: '0.85rem'
          }}>
            Return to Investigation Dashboard
          </a>
        </div>
      );
    }
  }

  return <Outlet />;
}
