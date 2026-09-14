import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import CaseLayout from './layouts/CaseLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import NewCase from './pages/NewCase';
import Reports from './pages/Reports';

import Overview from './pages/case/Overview';
import GraphView from './pages/case/GraphView';
import Attribution from './pages/case/Attribution';
import Evidence from './pages/case/Evidence';
import Report from './pages/case/Report';
import AnalysisProgress from './pages/case/AnalysisProgress';

import './styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes - Simplified for demo */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="cases" element={<Cases />} />
          <Route path="cases/new" element={<NewCase />} />
          <Route path="reports" element={<Reports />} />
          
          <Route path="cases/:caseId/analysis" element={<AnalysisProgress />} />
          
          <Route path="cases/:caseId" element={<CaseLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="graph" element={<GraphView />} />
            <Route path="attribution" element={<Attribution />} />
            <Route path="evidence" element={<Evidence />} />
            <Route path="report" element={<Report />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
