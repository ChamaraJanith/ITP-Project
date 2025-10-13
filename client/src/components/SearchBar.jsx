// // frontend/src/components/SearchBar.jsx
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";

// const SearchBar = () => {
//   const [query, setQuery] = useState("");
//   const [specialty, setSpecialty] = useState("");
//   const navigate = useNavigate();

//   const handleSearch = (e) => {
//     e.preventDefault();
//     if (!specialty) return alert("Select a specialty!");
//     navigate(`/specialty?specialty=${specialty}&name=${query}`);
//   };

//   return (
//     <form onSubmit={handleSearch} style={{ padding: "1rem", textAlign: "center" }}>
//       <input
//         type="text"
//         placeholder="Search doctor by name..."
//         value={query}
//         onChange={(e) => setQuery(e.target.value)}
//         style={{ padding: "0.5rem", width: "250px", marginRight: "0.5rem" }}
//       />
//       <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} style={{ padding: "0.5rem", marginRight: "0.5rem" }}>
//         <option value="">Select Specialty</option>
//         <option value="pediatrics">Pediatrics</option>
//         <option value="cardiology">Cardiology</option>
//         <option value="neurology">Neurology</option>
//         <option value="dentist">Dentist</option>
//       </select>
//       <button type="submit" style={{ padding: "0.5rem 1rem" }}>Search</button>
//     </form>
//   );
// };

// export default SearchBar;


// Path: /frontend/src/components/SearchBar.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!specialty) return alert("Select a specialty!");
    navigate(`/specialty?specialty=${specialty}&name=${query}`);
  };

  return (
    <form onSubmit={handleSearch} style={{ padding: "1rem", textAlign: "center" }}>
      <input
        type="text"
        placeholder="Search doctor by name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: "0.5rem", width: "250px", marginRight: "0.5rem" }}
      />

      <select
        value={specialty}
        onChange={(e) => setSpecialty(e.target.value)}
        style={{ padding: "0.5rem", marginRight: "0.5rem" }}
      >
        <option value="">Select Specialty</option>
        <option value="pediatrics">Pediatrics</option>
        <option value="cardiology">Cardiology</option>
        <option value="neurology">Neurology</option>
        <option value="dentist">Dentist</option>
      </select>

      <button type="submit" style={{ padding: "0.5rem 1rem" }}>🔍 Search</button>
    </form>
  );
};

export default SearchBar;
