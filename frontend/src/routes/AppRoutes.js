import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import InventoryPage from '../components/InventoryPage';
import SalesPage from '../components/SalesPage';
import ProductosView from '../components/ProductosView';
import Login from '../components/Login';
import ForgotUsername from '../components/ForgotUsername';
import ForgotPassword from '../components/ForgotPassword';
import ResetPassword from '../components/ResetPassword';
import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './PublicOnlyRoute';

/**
 * Archivo de rutas principal de la aplicación
 * Define las rutas y páginas que se renderizan según la URL
 */
export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Ruta principal del dashboard (protegida) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Rutas específicas (protegidas) */}
        <Route
          path="/inventario"
          element={
            <ProtectedRoute>
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ventas"
          element={
            <ProtectedRoute>
              <SalesPage />
            </ProtectedRoute>
          }
        />

        {/* Catálogo público para clientes */}
        <Route path="/catalogo" element={<ProductosView />} />

        {/* Rutas de autenticación */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route path="/forgot-username" element={<ForgotUsername />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

  {/* Cualquier otra ruta redirige al dashboard (que está protegido) */}
  <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
