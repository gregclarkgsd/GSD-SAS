
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Applications } from './pages/Applications';
import { CashFlow } from './pages/CashFlow';
import { Retention } from './pages/Retention';
import { WeeklyPlanner } from './pages/WeeklyPlanner';
import { ProjectManagement } from './pages/ProjectManagement';
import { Staffing } from './pages/Staffing';
import { TenderAnalysis } from './pages/TenderAnalysis';
import { Settings } from './pages/Settings';

function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/cashflow" element={<CashFlow />} />
          <Route path="/retention" element={<Retention />} />
          <Route path="/weekly-planner" element={<WeeklyPlanner />} />
          <Route path="/pm" element={<ProjectManagement />} />
          <Route path="/staffing" element={<Staffing />} />
          <Route path="/tender-ai" element={<TenderAnalysis />} />
          <Route path="/settings" element={<Settings />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
