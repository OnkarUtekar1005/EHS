// src/components/common/Card/Card.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './Card.scss';

const Card = ({
  children,
  className = '',
  title,
  subtitle,
  footer,
  elevation = 'medium',
  noPadding = false
}) => {
  return (
    <div className={`card card-elevation-${elevation} ${className}`}>
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      
      <div className={`card-body ${noPadding ? 'no-padding' : ''}`}>
        {children}
      </div>
      
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  title: PropTypes.node,
  subtitle: PropTypes.node,
  footer: PropTypes.node,
  elevation: PropTypes.oneOf(['low', 'medium', 'high']),
  noPadding: PropTypes.bool
};

export default Card;