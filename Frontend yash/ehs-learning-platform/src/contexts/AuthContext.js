// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to login a user
  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authService.login(credentials);
      
      // Store user from response
      setCurrentUser(response.data);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
      throw err;
    }
  };

  // Function to logout a user
  const logout = async () => {
    try {
      await authService.logout();
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      // Even if server logout fails, we clear local state
      setCurrentUser(null);
    }
  };

  // Function to update user data
  const updateUserData = (userData) => {
    // Update context state
    setCurrentUser(userData);
    
    // Update localStorage if needed
    if (localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  // Check if user is already logged in on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Try to get current user from the API
        const response = await authService.getCurrentUser();
        setCurrentUser(response.data);
      } catch (err) {
        console.error('Error fetching current user:', err);
        // If API fails, try to get user from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            setCurrentUser(userData);
          } catch (e) {
            console.error('Failed to parse user data from localStorage', e);
            // Clear invalid user data
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        } else {
          // Clear token if no user data found
          localStorage.removeItem('token');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Context value
  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    updateUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;