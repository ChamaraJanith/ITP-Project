// components/Loading.jsx
import React from 'react';
import './Loading.css';

const Loading = () => {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="spinner-ring"></div>
        <p>Loading...</p>
      </div>
    </div>
  );
};

export default Loading;
