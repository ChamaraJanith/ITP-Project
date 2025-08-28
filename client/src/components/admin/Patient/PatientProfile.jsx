import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import '../Patient/PatientProfile.css';

function PatientProfile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/"); // redirect to login if no user
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  if (!user) return <p>Loading profile...</p>;

  return (
  <div className="patient-profile-container">
    <h2>Welcome, {user.name}</h2>
    <p><b>Email:</b> {user.email}</p>
    <p><b>Role:</b> {user.role}</p>
    {/* Add more patient fields here if needed */}
  </div>
);

}

export default PatientProfile;
