import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import InventoryPage from '../components/InventoryPage';
import SalesPage from '../components/SalesPage';

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

        {/* Ruta específica para el inventario */}
        <Route path="/inventario" element={<InventoryPage />} />

        {/* Ruta específica para ventas */}
        <Route path="/ventas" element={<SalesPage />} />

        {/* Cualquier otra ruta redirige al dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
