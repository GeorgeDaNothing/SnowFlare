import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { Dashboard } from './views/Dashboard';
import { VideoAnalysis } from './views/VideoAnalysis';
import { MoveDesigner } from './views/MoveDesigner';
import { AnalysisStudio } from './views/AnalysisStudio';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <TopNav />
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analysis" element={<VideoAnalysis />} />
          <Route path="/designer" element={<MoveDesigner />} />
          <Route path="/insights" element={<AnalysisStudio />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
