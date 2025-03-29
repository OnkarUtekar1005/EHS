// src/pages/Login/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import './LoginPage.scss';

// SVG icons as components for better readability
const EyeIcon = () => (
  <>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </>
);

const EyeOffIcon = () => (
  <>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </>
);

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    remember: false
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setCredentials(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTogglePassword = () => setIsPasswordVisible(prev => !prev);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
  
    try {
      const { username, password } = credentials;
      const userData = await AuthService.login(username, password);
      
      // Navigate based on user role and domain selection
      const role = userData.role.toUpperCase();
      
      if (role === 'ADMIN') {
        // Admins go directly to the admin dashboard
        navigate('/admin/dashboard');
      } else {
        // Regular employees should go to domain selection if they don't have a domain
        // or directly to the dashboard if they already have one
        if (!userData.domainId) {
          navigate('/domain-selection');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <div className="logo-icon">EHS</div>
        </div>
        
        <h1>Enterprise Learning Platform</h1>
        
        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-wrapper">
              <input
                type="text"
                id="username"
                value={credentials.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                type={isPasswordVisible ? "text" : "password"}
                id="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={handleTogglePassword}
                aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#aaa" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  {isPasswordVisible ? <EyeIcon /> : <EyeOffIcon />}
                </svg>
              </button>
            </div>
          </div>

          <div className="form-extras">
            <div className="remember-container">
              <input 
                type="checkbox" 
                id="remember" 
                checked={credentials.remember}
                onChange={handleChange}
                className="remember-checkbox" 
              />
              <label htmlFor="remember" className="remember-label">Remember me</label>
            </div>
            <a href="/forgot-password" className="forgot-password">
              Forgot Password?
            </a>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="signup-link">
            <p>Don't have an account? <a href="/register">Sign Up</a></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;