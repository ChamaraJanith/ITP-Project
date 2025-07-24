import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirm) {
      alert('Passwords do not match');
      return;
    }
    // Replace with your registration logic
    alert(
      `Registered!\nName: ${name}\nEmail: ${email}\nPassword: ${password}`
    );
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="card shadow p-4" style={{ maxWidth: 420, width: '100%' }}>
        <div className="card-body">
          <h2 className="card-title text-center mb-4">Register</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="registerName" className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                id="registerName"
                placeholder="Enter your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="registerEmail" className="form-label">Email address</label>
              <input
                type="email"
                className="form-control"
                id="registerEmail"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="registerPassword" className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                id="registerPassword"
                placeholder="Create a password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="registerConfirm" className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-control"
                id="registerConfirm"
                placeholder="Repeat the password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-success w-100">Register</button>
          </form>
          <div className="mt-3 text-center">
            <span>Have an account? </span>
            <a href="/login" className="text-decoration-none">Login here</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
