// src/utils/jwt-debugger.js
/**
 * Utility functions for debugging JWT token issues
 */

// Debug the current token in localStorage
export const debugJwtToken = () => {
    const token = localStorage.getItem('token');
    console.log('==== JWT TOKEN DEBUG ====');
    console.log('Token exists:', !!token);
    
    if (!token) {
      console.log('No token found in localStorage');
      console.log('========================');
      return;
    }
    
    console.log('Token length:', token.length);
    console.log('Token starts with "Bearer ":', token.startsWith('Bearer '));
    console.log('First 20 chars of token:', token.substring(0, 20) + '...');
    
    // Check token format (should have 3 parts separated by dots)
    const tokenParts = token.split('.');
    console.log('Token has valid JWT format (3 parts):', tokenParts.length === 3);
    
    // Try to decode token payload
    if (tokenParts.length === 3) {
      try {
        // Base64 decode the payload (middle part)
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('Token payload:', payload);
        
        // Check expiration if available
        if (payload.exp) {
          const expTime = new Date(payload.exp * 1000);
          const now = new Date();
          console.log('Token expires:', expTime.toLocaleString());
          console.log('Current time:', now.toLocaleString());
          console.log('Token expired:', expTime < now);
        }
      } catch (e) {
        console.error('Failed to decode token payload:', e);
      }
    }
    
    console.log('========================');
  };
  
  // Store token properly (without Bearer prefix) in localStorage
  export const storeTokenProperly = (token) => {
    // Remove Bearer prefix if it exists
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    localStorage.setItem('token', cleanToken);
    console.log('Token stored properly (without Bearer prefix)');
    return cleanToken;
  };
  
  // Add Authorization header with proper Bearer prefix
  export const createAuthHeader = (token) => {
    // Ensure token doesn't already have Bearer prefix
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    return `Bearer ${cleanToken}`;
  };
  
  export default { debugJwtToken, storeTokenProperly, createAuthHeader };