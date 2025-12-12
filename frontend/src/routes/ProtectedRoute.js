// components/ProtectedRoute.js - VERSIÓN CORREGIDA
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

export default function ProtectedRoute({ children, requiredRole, requiredAdmin = false }) {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuthentication = async () => {
      setIsLoading(true);
      
      // SOLO verificar presencia del token, NO su validez
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      // Obtener usuario desde localStorage (si existe)
      const localUser = authService.getUser();
      
      if (localUser) {
        setUser(localUser);
        setIsAuthenticated(true);
      } else {
        // Si no hay usuario en localStorage, verificar con backend UNA sola vez
        try {
          const response = await fetch('http://localhost:3000/auth/verify', {
            headers: { 
              'Authorization': `Bearer ${token}` 
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              // Guardar usuario en localStorage
              authService.setAuthData(token, data.user);
              setUser(data.user);
              setIsAuthenticated(true);
            } else {
              setIsAuthenticated(false);
              authService.logout();
            }
          } else {
            setIsAuthenticated(false);
            authService.logout();
          }
        } catch (error) {
          console.log('Error verificando token:', error.message);
          // En caso de error de red, permitir acceso con datos locales si existen
          if (localUser) {
            setUser(localUser);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        }
      }
      
      setIsLoading(false);
    };

    // Verificar SOLO al montar el componente
    verifyAuthentication();
    
    // ⚠️ ¡¡¡REMOVER COMPLETAMENTE EL setInterval!!!
    // El interceptor manejará los refrescos automáticos
    // NO usar: const interval = setInterval(verifyAuthentication, 5 * 60 * 1000);
    
    return () => {
      // Limpieza opcional si agregas event listeners
    };
  }, []); // Solo al montar, no en intervalos

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