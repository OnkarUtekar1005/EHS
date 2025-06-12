// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authService.login(credentials);
      setCurrentUser(response.data);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
      throw err;
    }
  };

  const logout = async () => {
    // Clear user state FIRST - this is critical
    setCurrentUser(null);
    
    // Then clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Try the API call in the background
    try {
      authService.logout().catch(err => {
      });
    } catch (err) {
    }
  };

  const updateUserData = (userData) => {
    setCurrentUser(userData);
    if (localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };
  
  const isAdmin = () => {
    if (!currentUser) {
      return false;
    }
    
    return Boolean(
      currentUser.roles?.includes('ADMIN') || 
      currentUser.role === 'ADMIN' ||
      currentUser.userType === 'ADMIN' ||
      currentUser.isAdmin === true
    );
  };

  // Initialize auth state from localStorage
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getCurrentUser();
        setCurrentUser(response.data);
      } catch (err) {
        
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            setCurrentUser(JSON.parse(userStr));
          } catch (e) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        } else {
          localStorage.removeItem('token');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    updateUserData,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};