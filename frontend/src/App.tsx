import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DatasetProvider } from './context/DatasetContext';

import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Overview } from './pages/Overview';
import { DataWorkspace } from './pages/DataWorkspace';
import { DatasetImport } from './pages/DatasetImport';
import { DataValidation } from './pages/DataValidation';
import { BusinessMetrics } from './pages/BusinessMetrics';
import { CustomerAnalytics } from './pages/CustomerAnalytics';
import { RFMAnalysis } from './pages/RFMAnalysis';
import { CustomerSegmentation } from './pages/CustomerSegmentation';
import { MLModelStudio } from './pages/MLModelStudio';
import { BehaviourAnalysis } from './pages/BehaviourAnalysis';
import { DemandInsights } from './pages/DemandInsights';
import { CustomerProfiles } from './pages/CustomerProfiles';
import { SegmentComparison } from './pages/SegmentComparison';
import { MarketingInsights } from './pages/MarketingInsights';
import { ReportsExports } from './pages/ReportsExports';
import { AnalysisHistory } from './pages/AnalysisHistory';
import { Settings } from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
        <div className="w-8 h-8 rounded-full border-2 border-brand-900 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DatasetProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#1E293B',
                color: '#fff',
                fontSize: '12px',
                borderRadius: '8px',
              },
            }}
          />

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="workspace" element={<DataWorkspace />} />
              <Route path="import" element={<DatasetImport />} />
              <Route path="validation" element={<DataValidation />} />
              <Route path="metrics" element={<BusinessMetrics />} />
              <Route path="analytics" element={<CustomerAnalytics />} />
              <Route path="rfm" element={<RFMAnalysis />} />
              <Route path="segmentation" element={<CustomerSegmentation />} />
              <Route path="model-studio" element={<MLModelStudio />} />
              <Route path="behaviour" element={<BehaviourAnalysis />} />
              <Route path="demand" element={<DemandInsights />} />
              <Route path="profiles" element={<CustomerProfiles />} />
              <Route path="compare" element={<SegmentComparison />} />
              <Route path="insights" element={<MarketingInsights />} />
              <Route path="reports" element={<ReportsExports />} />
              <Route path="history" element={<AnalysisHistory />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DatasetProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
