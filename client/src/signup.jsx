import React, { useState } from 'react';
import { Box } from "@chakra-ui/react"
import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home.jsx"
import CreatePage from "./pages/CreatePage.jsx" 
import Navbar from "./component/Navbar.jsx"   
import Chatbot from "./AI/Chatbot.jsx"  
import 'bootstrap/dist/css/bootstrap.min.css';
import signup from "./Signup.jsx"


function signup() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');

  // Update form state when inputs change
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // Handle signup form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Signup successful! Please log in.');
        setForm({ name: '', email: '', password: '' });
      } else {
        setMessage(data?.error || 'Signup failed');
      }
    } catch (error) {
      setMessage('Server error, please try again later.');
    }
  };

  return (
    <div>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          type="text"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Sign Up</button>
      </form>
      {message && <p>{message}</p>}
      <p>
        Already have an account? <a href="/login">Log in here</a>
      </p>
    </div>
  );
}

export default signup;
