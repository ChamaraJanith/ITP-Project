// context/AppContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const [isLoggedin, setIsLoggedin] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:7000';

  // Configure axios defaults
  axios.defaults.withCredentials = true;

  // Check if user is already logged in on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.post(`${backendUrl}/api/auth/isAuth`);
      
      if (response.data.success) {
        setIsLoggedin(true);
        setUserData(response.data.user);
      }
    } catch (error) {
      console.log('User not authenticated');
      setIsLoggedin(false);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const response = await axios.post(`${backendUrl}/api/auth/logout`);
      
      if (response.data.success) {
        setIsLoggedin(false);
        setUserData(null);
        toast.success('Logged out successfully');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const value = {
    isLoggedin,
    setIsLoggedin,
    userData,
    setUserData,
    backendUrl,
    loading,
    logout,
    checkAuthStatus,
    toast
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
