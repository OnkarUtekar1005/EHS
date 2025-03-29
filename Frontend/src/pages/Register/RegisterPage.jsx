// src/pages/Register/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterService from '../../services/register.service';
import './RegisterPage.scss';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'EMPLOYEE'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState({
    password: false,
    confirmPassword: false
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setIsPasswordVisible(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    const { username, password, confirmPassword } = formData;
    
    // Basic form validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (username.length < 3 || username.length > 50) {
      setError('Username must be between 3 and 50 characters');
      return false;
    }

    if (password.length < 6 || password.length > 100) {
      setError('Password must be between 6 and 100 characters');
      return false;
    }

    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { username, email, password, role } = formData;
      await RegisterService.register(username, email, password, role);

      // Show success message and redirect to login
      alert('Registration successful! Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // SVG components for better readability
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

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-logo">
          <div className="logo-icon">EHS</div>
        </div>
        
        <div className="register-header">
          <h1>Create an Account</h1>
          <p>Join the Enterprise Learning Platform</p>
        </div>

        <form onSubmit={handleRegister} className="register-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-wrapper">
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                required
                minLength={3}
                maxLength={50}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                type={isPasswordVisible.password ? "text" : "password"}
                id="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
                minLength={6}
                maxLength={100}
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => togglePasswordVisibility('password')}
                aria-label={isPasswordVisible.password ? "Hide password" : "Show password"}
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
                  {isPasswordVisible.password ? <EyeIcon /> : <EyeOffIcon />}
                </svg>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <input
                type={isPasswordVisible.confirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                minLength={6}
                maxLength={100}
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => togglePasswordVisibility('confirmPassword')}
                aria-label={isPasswordVisible.confirmPassword ? "Hide password" : "Show password"}
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
                  {isPasswordVisible.confirmPassword ? <EyeIcon /> : <EyeOffIcon />}
                </svg>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">Account Type</label>
            <div className="select-wrapper">
              <select
                id="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            className="register-button"
            disabled={isLoading}
          >
            {isLoading ? 'Registering...' : 'Create Account'}
          </button>

          <div className="login-link">
            <p>
              Already have an account? 
              <a href="/login">Log In</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;