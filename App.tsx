import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const NewOrder = lazy(() => import('./pages/NewOrder'));
const Production = lazy(() => import('./pages/Production'));
const Products = lazy(() => import('./pages/Products'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Reports = lazy(() => import('./pages/Reports'));
const Employees = lazy(() => import('./pages/Employees'));
const Settings = lazy(() => import('./pages/Settings'));
const Ingredients = lazy(() => import('./pages/Ingredients'));
const Recipes = lazy(() => import('./pages/Recipes'));
const CostAnalysis = lazy(() => import('./pages/CostAnalysis'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));

const PageLoader: React.FC = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
    <div className="flex flex-col items-center gap-3">
      <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="font-display text-sm font-semibold text-gray-600 dark:text-gray-300">Carregando Gelato Manager...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Rota Pública de Autenticação */}
            <Route path="/login" element={<Login />} />

            {/* Rotas Protegidas por Perfil */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['Administrador', 'Gerente']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pos"
              element={
                <ProtectedRoute allowedRoles={['Administrador', 'Gerente', 'Caixa']}>
                  <NewOrder />
                </ProtectedRoute>
              }
            />

            <Route
              path="/production"
              element={
                <ProtectedRoute allowedRoles={['Administrador', 'Gerente', 'Produção']}>
                  <Production />
                </ProtectedRoute>
              }
            />

            <Route
              path="/products"
              element={
                <ProtectedRoute allowedRoles={['Administrador', 'Gerente', 'Produção', 'Caixa']}>
                  <Products />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ingredients"
              element={
                <ProtectedRoute allowedRoles={['Administrador', 'Gerente', 'Produção']}>
                  <Ingredients />
                </ProtectedRoute>
              }
            />

            <Route
              path="/recipes"
              element={
                <ProtectedRoute allowedRoles={['Administrador', 'Gerente', 'Produção']}>
                  <Recipes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inventory"
              element={
                <ProtectedRoute allowedRoles={['Administrador', 'Gerente', 'Produção']}>
                  <Inventory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['Administrador', 'Gerente']}>
                  <Reports />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cost-analysis"
              element={
                <ProtectedRoute allowedRoles={['Administrador', 'Gerente']}>
                  <CostAnalysis />
                </ProtectedRoute>
              }
            />

            <Route
              path="/employees"
              element={
                <ProtectedRoute allowedRoles={['Administrador', 'Gerente']}>
                  <Employees />
                </ProtectedRoute>
              }
            />

            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['Administrador', 'Gerente']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['Administrador', 'Gerente']}>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
