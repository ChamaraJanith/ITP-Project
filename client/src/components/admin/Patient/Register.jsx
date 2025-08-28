import React, { useState } from "react";
import axios from "axios";
<<<<<<< HEAD
import { useNavigate } from "react-router-dom"; // ✅ import useNavigate
import "./styles/Register.css";
=======
import '../Patient/Register.css';
>>>>>>> 9c56207abfbad590a992f588771822b05d9f5605

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

<<<<<<< HEAD
  const navigate = useNavigate(); // ✅ initialize navigate

=======
>>>>>>> 9c56207abfbad590a992f588771822b05d9f5605
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:7000/api/auth/register", {
        name,
        email,
        password,
      });
<<<<<<< HEAD

      setMsg(res.data.message);

      // Navigate to homepage after successful registration
      navigate("/"); // ✅ homepage route
=======
      setMsg(res.data.message);
>>>>>>> 9c56207abfbad590a992f588771822b05d9f5605
    } catch (err) {
      setMsg(err.response?.data?.message || "Error registering user");
    }
  };

<<<<<<< HEAD
  return (
    <div className="register-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        /><br /><br />
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
        <button type="submit">Sign Up</button>
      </form>
      <p>{msg}</p>
    </div>
  );
=======
return (
  <div className="register-container">
    <h2>Sign Up</h2>
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      /><br /><br />
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
      <button type="submit">Sign Up</button>
    </form>
    <p>{msg}</p>
  </div>
);

>>>>>>> 9c56207abfbad590a992f588771822b05d9f5605
}

export default Register;
