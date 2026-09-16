import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const NewOrder = lazy(() => import('./pages/NewOrder'));
const Products = lazy(() => import('./pages/Products'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Reports = lazy(() => import('./pages/Reports'));
const Employees = lazy(() => import('./pages/Employees'));
const Settings = lazy(() => import('./pages/Settings'));
const Ingredients = lazy(() => import('./pages/Ingredients'));
const Recipes = lazy(() => import('./pages/Recipes'));
const CostAnalysis = lazy(() => import('./pages/CostAnalysis'));

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
    <HashRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pos" element={<NewOrder />} />
          <Route path="/products" element={<Products />} />
          <Route path="/ingredients" element={<Ingredients />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/cost-analysis" element={<CostAnalysis />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
};

export default App;
