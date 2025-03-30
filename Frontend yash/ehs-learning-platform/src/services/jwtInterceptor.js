// src/services/jwtInterceptor.js
import axios from 'axios';

// Create a custom instance for API calls
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Debug function to trace token issues
const debugTokenInfo = () => {
  const token = localStorage.getItem('token');
  console.log('====== JWT TOKEN DEBUG ======');
  console.log('Token exists:', !!token);
  if (token) {
    console.log('Token length:', token.length);
    console.log('Token first 10 chars:', token.substring(0, 10) + '...');
    
    // Check token format
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('WARNING: Token does not appear to be in valid JWT format (should have 3 parts)');
    }
    
    // Try to decode payload (middle part)
    try {
      const payload = JSON.parse(atob(parts[1]));
      console.log('Token payload:', payload);
      
      // Check expiration
      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000);
        const now = new Date();
        console.log('Token expires at:', expDate.toLocaleString());
        console.log('Token expired:', expDate < now);
      }
    } catch (e) {
      console.error('Failed to decode token payload:', e);
    }
  }
  console.log('============================');
};

// Request interceptor with detailed logging
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    debugTokenInfo();
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log(`JWT: Adding token to ${config.method.toUpperCase()} ${config.url}`);
    } else {
      console.warn(`JWT: No token available for ${config.method.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('JWT: Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Track if we're already redirecting to avoid loops
let isRedirecting = false;

// Response interceptor with error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`JWT: Request to ${response.config.url} succeeded with status ${response.status}`);
    return response;
  },
  (error) => {
    console.error('JWT: API Error:', error);
    
    // Handle 401 Unauthorized only if we're not already redirecting
    if (error.response && error.response.status === 401 && !isRedirecting) {
      console.log('JWT: Unauthorized request detected, checking token...');
      
      // Check if we have a token
      const token = localStorage.getItem('token');
      if (token) {
        console.warn('JWT: 401 error with token present - token may be invalid or expired');
      } else {
        console.warn('JWT: 401 error with no token present');
      }
      
      // Set redirecting flag
      isRedirecting = true;
      
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login after a short delay
      console.log('JWT: Redirecting to login page...');
      setTimeout(() => {
        window.location.href = '/login';
        // Reset flag after redirect
        isRedirecting = false;
      }, 100);
    }
    
    // Log complete error details for debugging
    if (error.response) {
      console.error('JWT: Response error details:', {
        status: error.response.status,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;