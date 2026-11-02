import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Spinner } from './components/common/Spinner.js';
import { ToastProvider } from './components/common/Toast.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { SettingsProvider } from './context/SettingsContext.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { InventoryPage } from './pages/InventoryPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { PosPage } from './pages/PosPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { SalesHistoryPage } from './pages/SalesHistoryPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" label="Authenticating session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SettingsProvider>
            <Routes>
              {/* Public Authentication Route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Store Management Routes */}
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <AppLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<Navigate to="/billing" replace />} />
                <Route path="billing" element={<PosPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="sales" element={<SalesHistoryPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SettingsProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
