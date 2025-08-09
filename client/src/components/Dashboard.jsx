// components/Dashboard.jsx
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const Dashboard = () => {
  const { userData, logout } = useContext(AppContext);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Welcome to HealX Dashboard</h1>
      <p>Hello, {userData?.name}!</p>
      <p>Email: {userData?.email}</p>
      <button 
        onClick={logout}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '1rem'
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
