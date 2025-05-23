// src/components/auth/TokenVerifier.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

/**
 * Component that verifies the JWT token status upon mounting
 * and redirects to login if token is invalid
 */
const TokenVerifier = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('TokenVerifier: No token found');
        navigate('/login');
        return;
      }
      
      console.log('TokenVerifier: Checking token validity');
      try {
        // Call the API to verify token is valid
        const isValid = await authService.verifyToken();
        
        if (!isValid) {
          console.warn('TokenVerifier: Token verification failed');
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          console.log('TokenVerifier: Token verification successful');
        }
      } catch (error) {
        console.error('TokenVerifier: Error verifying token', error);
        // Clear token on error
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    };
    
    verifyAuth();
  }, [navigate]);
  
  // This component doesn't render anything
  return null;
};

export default TokenVerifier;