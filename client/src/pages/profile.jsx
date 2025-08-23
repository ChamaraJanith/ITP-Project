import React, { useState, useEffect } from "react";
import axios from "axios";

function Profile({ userId }) {
  const [profile, setProfile] = useState({});
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:7000/api/PatientProfile/${userId}`);
        setProfile(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    if (userId) fetchProfile();
  }, [userId]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const res = await axios.put(`http://localhost:7000/api/PatientProfile/${userId}`, profile);
      setProfile(res.data);
      setEditing(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "auto", padding: "20px" }}>
      <h2>My Profile</h2>
      <div>
        <label>Name:</label>
        <input
          type="text"
          name="name"
          value={profile.name || ""}
          onChange={handleChange}
          disabled={!editing}
        />
      </div>
      <div>
        <label>Email:</label>
        <input
          type="text"
          name="email"
          value={profile.email || ""}
          onChange={handleChange}
          disabled={!editing}
        />
      </div>
      <div>
        <label>Phone:</label>
        <input
          type="text"
          name="phone"
          value={profile.phone || ""}
          onChange={handleChange}
          disabled={!editing}
        />
      </div>
      <div>
        <label>Role:</label>
        <input type="text" value={profile.role || ""} disabled />
      </div>

      {editing ? (
        <button onClick={handleSave}>Save</button>
      ) : (
        <button onClick={() => setEditing(true)}>Edit</button>
      )}
    </div>
  );
}

export default Profile;
