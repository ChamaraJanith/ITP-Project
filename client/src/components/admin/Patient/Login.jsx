import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
<<<<<<< HEAD
import "./styles/Login.css";
=======
import '../Patient/Login.css';
>>>>>>> 9c56207abfbad590a992f588771822b05d9f5605

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:7000/api/auth/Login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setMsg(res.data.message);
      navigate("/");
    } catch (err) {
      setMsg(err.response?.data?.message || "Error logging in");
    }
  };

  return (
<<<<<<< HEAD
  <div className="login-page">
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br /><br />
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br /><br />
        <button type="submit">Login</button>
      </form>
      <p>{msg}</p>
    </div>
=======
  <div className="login-container">
    <h2>Login</h2>
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      /><br /><br />
      <input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      /><br /><br />
      <button type="submit">Login</button>
    </form>
    <p>{msg}</p>
>>>>>>> 9c56207abfbad590a992f588771822b05d9f5605
  </div>
);

}

export default Login;
