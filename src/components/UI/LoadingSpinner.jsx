import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ text = 'Loading your professional world...' }) => {
  return (
    <div className="spinner-overlay">
      <div className="spinner-content">
        <h1 className="spinner-logo">
          lynq<span>.</span>
        </h1>
        <div className="spinner-ring"></div>
        <p className="spinner-text">{text}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
