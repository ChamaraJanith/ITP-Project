import React from "react";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div style={{ maxWidth: "600px", margin: "50px auto" }}>
      <h2>Welcome, {user?.name}</h2>
      <p>Email: {user?.email}</p>
    </div>
  );
}

export default Dashboard;
