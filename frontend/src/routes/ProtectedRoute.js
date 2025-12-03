// components/ProtectedRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import api from '../api/api';

export default function ProtectedRoute({ children, requiredRole, requiredAdmin = false }) {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuthentication = async () => {
      setIsLoading(true);
      
      // Primero verificar si hay token localmente
      const localAuth = authService.isAuthenticated();
      const localUser = authService.getUser();
      
      if (!localAuth) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      // Intentar verificar token con el servidor
      try {
        const response = await api.verifyCurrentToken();
        if (response.success && response.user) {
          // Actualizar datos del usuario si hay cambios
          authService.updateUserData(response.user);
          setUser(response.user);
          setIsAuthenticated(true);
        } else {
          authService.logout();
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.log('Error verificando token, usando datos locales:', error.message);
        // Si falla la verificación pero hay datos locales, permitir acceso offline
        if (localUser) {
          setUser(localUser);
          setIsAuthenticated(true);
        } else {
          authService.logout();
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuthentication();
    
    // Verificar autenticación cada 5 minutos
    const interval = setInterval(verifyAuthentication, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Mostrar loading mientras verifica
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // No autenticado
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        replace 
        state={{ 
          from: location,
          message: 'Por favor inicie sesión para acceder a esta página' 
        }} 
      />
    );
  }

  // Verificar rol si se requiere
  if (requiredRole && user && user.rol !== requiredRole) {
    // Redirigir según el rol del usuario
    if (user.rol === 'admin') {
      return <Navigate to="/" replace />;
    } else {
      return <Navigate to="/ventas" replace />;
    }
  }

  // Verificar si es admin si se requiere
  if (requiredAdmin && user && user.rol !== 'admin') {
    return (
      <Navigate 
        to="/" 
        replace 
        state={{ 
          message: 'Acceso restringido a administradores' 
        }} 
      />
    );
  }

  // Pasar datos del usuario a los hijos si es necesario
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { user });
    }
    return child;
  });

  return childrenWithProps;
}