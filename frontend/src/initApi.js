// src/initApi.js
import '../src/api/api'; // Esto activa el interceptor automáticamente
import { initSessionManager } from './api/api';

// Inicializa el sistema de sesión
console.log('🚀 Inicializando sistema de autenticación...');

// Verificar si hay token al cargar
const token = localStorage.getItem('token');
if (token) {
  console.log('🔐 Token detectado al iniciar');
}

// Inicializar el gestor de sesión
const cleanupSessionManager = initSessionManager();

// Opcional: Limpiar al desmontar (si usas SPA)
if (typeof window !== 'undefined') {
  window.cleanupAuth = cleanupSessionManager;
}

export default {};