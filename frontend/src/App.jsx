import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/shell/AppShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import NewCase from './pages/NewCase';
import AnalysisProgress from './pages/AnalysisProgress';
import InvestigationOverview from './pages/InvestigationOverview';
import TransactionGraphPage from './pages/TransactionGraphPage';
import AttributionRisk from './pages/AttributionRisk';
import Evidence from './pages/Evidence';
import AuditLedger from './pages/AuditLedger';
import GeospatialRadar from './pages/GeospatialRadar';
import EntityDossier from './pages/EntityDossier';
import Report from './pages/Report';
import Reports from './pages/Reports';
import Investigations from './pages/Investigations';
import InvestigationWorkspace from './pages/InvestigationWorkspace';
import Disclosure from './pages/Disclosure';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              {/* Core Command & Cases Hub */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cases" element={<Cases />} />
              <Route path="/cases/new" element={<NewCase />} />

              {/* Dedicated Investigation Workspace (1 tab = 1 workspace) */}
              <Route path="/investigations" element={<Investigations />} />
              <Route path="/investigations/active" element={<Navigate to="/investigations/INV-001/overview" replace />} />
              <Route path="/investigations/:id" element={<InvestigationWorkspace />} />
              <Route path="/investigations/:id/:tab" element={<InvestigationWorkspace />} />
              <Route path="/cases/:id" element={<InvestigationWorkspace />} />
              <Route path="/cases/:id/:tab" element={<InvestigationWorkspace />} />

              {/* Direct Tool Workspaces */}
              <Route path="/transactions" element={<Navigate to="/investigations/INV-001/transactions" replace />} />
              <Route path="/graph" element={<TransactionGraphPage />} />
              <Route path="/timeline" element={<Navigate to="/investigations/INV-001/timeline" replace />} />
              <Route path="/risk" element={<AttributionRisk />} />
              <Route path="/attribution" element={<AttributionRisk />} />
              <Route path="/vasp" element={<AttributionRisk />} />
              <Route path="/geospatial" element={<GeospatialRadar />} />
              <Route path="/evidence" element={<Evidence />} />
              <Route path="/entity" element={<EntityDossier />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/report" element={<Report />} />

              {/* System & Audit */}
              <Route path="/disclosure" element={<Disclosure />} />
              <Route path="/audit" element={<AuditLedger />} />
              <Route path="/ledger" element={<AuditLedger />} />
              <Route path="/chain-of-custody" element={<Evidence />} />
              <Route path="/admin" element={<Dashboard />} />

              {/* Analysis pipelines */}
              <Route path="/cases/analysis" element={<AnalysisProgress />} />
              <Route path="/analysis-progress" element={<AnalysisProgress />} />
              <Route path="/cases/:id/analysis" element={<AnalysisProgress />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
