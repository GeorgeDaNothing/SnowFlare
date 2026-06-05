import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute';
import { DebugPanel } from '@/components/DebugPanel';
import { Sidebar } from '@/components/Sidebar';
import { MigrationScreen } from '@/components/MigrationScreen';
import { isMigrationComplete, hasLegacyData } from '@/lib/migrate';
import { Simulation } from '@/views/Simulation';
import { MoveDesigner } from '@/views/MoveDesigner';
import { VideoAnalysis } from '@/views/VideoAnalysis';
import { AnalysisStudio } from '@/views/AnalysisStudio';
import { TrainingLogView } from '@/views/TrainingLog';
import { TechniqueLibrary } from '@/views/TechniqueLibrary';
import { Presets } from '@/views/Presets';
import { Login } from '@/views/auth/Login';
import { Register } from '@/views/auth/Register';
import { ForgotPassword } from '@/views/auth/ForgotPassword';
import { ResetPassword } from '@/views/auth/ResetPassword';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <div className="flex-1">
          {children}
        </div>
      </main>
      <DebugPanel />
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const authPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isAuthPage = authPaths.some(path => location.pathname.startsWith(path));

  return (
    <Routes>
      {/* Public auth routes - redirect if already logged in */}
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
      <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
      <Route path="/reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />

      {/* Protected app routes */}
      <Route path="/" element={<ProtectedRoute><Layout><Simulation /></Layout></ProtectedRoute>} />
      <Route path="/analysis" element={<ProtectedRoute><Layout><VideoAnalysis /></Layout></ProtectedRoute>} />
      <Route path="/designer" element={<ProtectedRoute><Layout><MoveDesigner /></Layout></ProtectedRoute>} />
      <Route path="/insights" element={<ProtectedRoute><Layout><AnalysisStudio /></Layout></ProtectedRoute>} />
      <Route path="/library" element={<ProtectedRoute><Layout><TechniqueLibrary /></Layout></ProtectedRoute>} />
      <Route path="/training-log" element={<ProtectedRoute><Layout><TrainingLogView /></Layout></ProtectedRoute>} />
      <Route path="/presets" element={<ProtectedRoute><Layout><Presets /></Layout></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [migrationDone, setMigrationDone] = useState(isMigrationComplete() || !hasLegacyData());
  const handleMigrationComplete = useCallback(() => setMigrationDone(true), []);

  return (
    <AuthProvider>
      <Router>
        {!migrationDone ? (
          <MigrationScreen onComplete={handleMigrationComplete} />
        ) : (
          <AppRoutes />
        )}
      </Router>
    </AuthProvider>
  );
}
