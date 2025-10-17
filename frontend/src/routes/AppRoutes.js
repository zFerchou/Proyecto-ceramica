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

/**
 * Archivo de rutas principal de la aplicación
 * Define las rutas y páginas que se renderizan según la URL
 */
export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Ruta principal del dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* Rutas específicas */}
        <Route path="/inventario" element={<InventoryPage />} />
        <Route path="/ventas" element={<SalesPage />} />

        {/* Catálogo público para clientes */}
        <Route path="/catalogo" element={<ProductosView />} />

        {/* Rutas de autenticación */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-username" element={<ForgotUsername />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Cualquier otra ruta redirige al dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
