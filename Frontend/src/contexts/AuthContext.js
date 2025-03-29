// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check for existing token on initial load
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Simulate logged in user
        setCurrentUser({
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'employee',
          domain: 'safety-officer'
        });
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);
  
  // Login function
  const login = async (username, password) => {
    // Demo login function - in real app would call API
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = {
          id: 1,
          name: username,
          email: `${username}@example.com`,
          role: username === 'admin' ? 'admin' : 'employee',
          domain: username === 'admin' ? null : 'safety-officer'
        };
        
        localStorage.setItem('token', 'demo-token');
        setCurrentUser(user);
        resolve(user);
      }, 500);
    });
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };
  
  // Update user domain
  const updateUserDomain = (userId, domainId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const updatedUser = {
          ...currentUser,
          domain: domainId
        };
        setCurrentUser(updatedUser);
        resolve(updatedUser);
      }, 300);
    });
  };
  
  // Context value
  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === 'admin',
    isLoading,
    login,
    logout,
    updateUserDomain
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};