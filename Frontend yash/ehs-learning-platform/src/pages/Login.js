// src/pages/Login.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();

  useEffect(() => {
    // If already logged in, redirect to appropriate dashboard
    if (currentUser) {
      if (isAdmin()) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      // If not logged in, redirect to landing page
      navigate('/');
    }
  }, [currentUser, navigate, isAdmin]);

  // This component just handles redirects, no UI needed
  return null;
};

export default Login;