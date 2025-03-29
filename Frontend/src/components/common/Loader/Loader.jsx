// src/components/common/Loader/Loader.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './Loader.scss';

const Loader = ({ size = 'medium', color = 'primary', fullPage = false, text = 'Loading...' }) => {
  return (
    <div className={`loader-container ${fullPage ? 'full-page' : ''}`}>
      <div className={`loader ${size} ${color}`}>
        <div className="spinner"></div>
        {text && <p className="loading-text">{text}</p>}
      </div>
    </div>
  );
};

Loader.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  color: PropTypes.oneOf(['primary', 'secondary', 'white']),
  fullPage: PropTypes.bool,
  text: PropTypes.string
};

export default Loader;