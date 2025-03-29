// src/components/common/Input/Input.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './Input.scss';

const Input = ({
  type = 'text',
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  className = '',
  icon,
  iconPosition = 'left',
  helpText,
  autoComplete = 'on'
}) => {
  const inputId = `input-${name}`;
  
  return (
    <div className={`input-wrapper ${className} ${error ? 'has-error' : ''}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      
      <div className={`input-container ${icon ? `has-icon icon-${iconPosition}` : ''}`}>
        {icon && iconPosition === 'left' && <div className="input-icon">{icon}</div>}
        
        <input
          id={inputId}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`input-field ${error ? 'input-error' : ''}`}
          autoComplete={autoComplete}
        />
        
        {icon && iconPosition === 'right' && <div className="input-icon">{icon}</div>}
      </div>
      
      {error && <p className="input-error-message">{error}</p>}
      {helpText && !error && <p className="input-help-text">{helpText}</p>}
    </div>
  );
};

Input.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  helpText: PropTypes.string,
  autoComplete: PropTypes.string
};

export default Input;