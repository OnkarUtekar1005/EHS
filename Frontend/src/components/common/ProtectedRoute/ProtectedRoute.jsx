// src/components/common/ProtectedRoute/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import Loader from '../Loader/Loader';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { currentUser, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  
  // Show loader while checking authentication
  if (isLoading) {
    return <Loader fullPage />;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If role is required and user doesn't have it, redirect to appropriate page
  if (requiredRole && currentUser.role !== requiredRole) {
    // If user is not admin but tries to access admin routes
    if (requiredRole === 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    // If admin tries to access employee routes
    else if (currentUser.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }
  
  // If user doesn't have a domain selected, redirect to domain selection
  // But only for employee routes and if not coming from the login page
  if (
    !currentUser.domain && 
    currentUser.role !== 'admin' && 
    location.pathname !== '/domain-selection' &&
    !location.pathname.startsWith('/admin')
  ) {
    return <Navigate to="/domain-selection" replace />;
  }
  
  // If everything is okay, render the child components
  return children;
};

export default ProtectedRoute;