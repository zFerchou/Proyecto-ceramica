import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

export default function PublicOnlyRoute({ children }) {
  const location = useLocation();
  const authed = authService.isAuthenticated();
  if (authed) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return children;
}
