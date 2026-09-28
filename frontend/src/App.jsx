import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import PageContainer from './components/layout/PageContainer';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import NewCase from './pages/NewCase';
import AnalysisProgress from './pages/AnalysisProgress';
import InvestigationOverview from './pages/InvestigationOverview';
import TransactionGraphPage from './pages/TransactionGraphPage';
import AttributionRisk from './pages/AttributionRisk';
import Evidence from './pages/Evidence';
import Report from './pages/Report';
import Reports from './pages/Reports';
import Investigations from './pages/Investigations';
import InvestigationWorkspace from './pages/InvestigationWorkspace';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <Topbar />
      <div className="app-main">
        <PageContainer>
          <Outlet />
        </PageContainer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/investigations" element={<Investigations />} />
            <Route path="/investigations/:id" element={<InvestigationWorkspace />} />
            <Route path="/investigations/:id/:tab" element={<InvestigationWorkspace />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/cases/new" element={<NewCase />} />

            {/* Analysis Progress routes */}
            <Route path="/cases/analysis" element={<AnalysisProgress />} />
            <Route path="/analysis-progress" element={<AnalysisProgress />} />
            <Route path="/cases/:id/analysis" element={<AnalysisProgress />} />
            <Route path="/case/:id/analysis" element={<AnalysisProgress />} />

            {/* Canonical Case Investigation Routes (supporting /cases/:id and /case/:id) */}
            <Route path="/cases/:id" element={<InvestigationOverview />} />
            <Route path="/case/:id" element={<InvestigationOverview />} />
            <Route path="/cases/:id/overview" element={<InvestigationOverview />} />
            <Route path="/case/:id/overview" element={<InvestigationOverview />} />

            <Route path="/cases/:id/graph" element={<TransactionGraphPage />} />
            <Route path="/case/:id/graph" element={<TransactionGraphPage />} />

            <Route path="/cases/:id/attribution" element={<AttributionRisk />} />
            <Route path="/case/:id/attribution" element={<AttributionRisk />} />
            <Route path="/cases/:id/risk" element={<AttributionRisk />} />
            <Route path="/case/:id/risk" element={<AttributionRisk />} />

            <Route path="/cases/:id/evidence" element={<Evidence />} />
            <Route path="/case/:id/evidence" element={<Evidence />} />

            <Route path="/cases/:id/report" element={<Report />} />
            <Route path="/case/:id/report" element={<Report />} />
            <Route path="/cases/:id/disclosure" element={<Report />} />
            <Route path="/case/:id/disclosure" element={<Report />} />

            <Route path="/reports" element={<Reports />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
