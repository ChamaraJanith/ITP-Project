// client/src/services/api.js
const API_BASE_URL = 'http://localhost:7000';

// Regular user login
export const userLogin = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    return await response.json();
  } catch (error) {
    console.error('User login error:', error);
    throw error;
  }
};

// Admin login
export const adminLogin = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    return await response.json();
  } catch (error) {
    console.error('Admin login error:', error);
    throw error;
  }
};

// User registration
export const userRegister = async (name, email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password })
    });
    return await response.json();
  } catch (error) {
    console.error('User registration error:', error);
    throw error;
  }
};

// Logout functions
export const userLogout = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    return await response.json();
  } catch (error) {
    console.error('User logout error:', error);
    throw error;
  }
};

export const adminLogout = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    return await response.json();
  } catch (error) {
    console.error('Admin logout error:', error);
    throw error;
  }
};
