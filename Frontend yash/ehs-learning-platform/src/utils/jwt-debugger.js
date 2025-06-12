// src/utils/jwt-debugger.js
/**
 * Utility functions for debugging JWT token issues
 */

// Debug the current token in localStorage
export const debugJwtToken = () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return;
    }
    
    // Check token format (should have 3 parts separated by dots)
    const tokenParts = token.split('.');
    
    // Try to decode token payload
    if (tokenParts.length === 3) {
      try {
        // Base64 decode the payload (middle part)
        const payload = JSON.parse(atob(tokenParts[1]));
        
        // Check expiration if available
        if (payload.exp) {
          const expTime = new Date(payload.exp * 1000);
          const now = new Date();
          return expTime < now; // Return if expired
        }
      } catch (e) {
        // Token decode failed
        return true; // Consider as expired
      }
    }
    
    return false;
  };
  
  // Store token properly (without Bearer prefix) in localStorage
  export const storeTokenProperly = (token) => {
    // Remove Bearer prefix if it exists
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    localStorage.setItem('token', cleanToken);
    return cleanToken;
  };
  
  // Add Authorization header with proper Bearer prefix
  export const createAuthHeader = (token) => {
    // Ensure token doesn't already have Bearer prefix
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    return `Bearer ${cleanToken}`;
  };
  
  export default { debugJwtToken, storeTokenProperly, createAuthHeader };