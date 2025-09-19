// LoadingSpinner.js
import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'small' }) => {
  return (
    <div className={`loading-spinner ${size}`}>
      <div className="spinner-circle"></div>
    </div>
  );
};

export default LoadingSpinner;