import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import "../pages/styles/EditPatientProfile.css";

// Define your fields here for easy editing
const fields = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: true, pattern: "^[a-z0-9]+@[a-z0-9]+\\.[a-z]{2,}$" },
  { name: "phone", label: "Phone", type: "text", required: true, maxLength: 10 },
  { name: "gender", label: "Gender", type: "select", required: true, options: ["Male", "Female", "Other"] },
  { name: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
  { name: "role", label: "Role", type: "text", required: false, disabled: true }
];

const EditPatientProfile = () => {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const id = paramId || location.state?.patient?._id;

  // Initialize formData with all fields
  const [formData, setFormData] = useState(
    fields.reduce((acc, f) => ({ ...acc, [f.name]: "" }), {})
  );
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      setApiError("");
      
      try {
        let data;
        
        if (location.state?.patient) {
          data = location.state.patient;
        } else {
          // FIX: Added '/profile' to the API path
          const response = await axios.get(`/api/users/profile/${id}`);
          data = response.data.data;
        }

        // Format the data for the form
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          gender: data.gender || "",
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
          role: data.role || "",
        });
      } catch (err) {
        console.error("Error loading patient data:", err);
        setApiError("Failed to load patient data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, location.state]);

  const handleChange = (e) => {
    let { name, value } = e.target;
    
    if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 letters";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[a-z0-9]+@[a-z0-9]+\.[a-z]{2,}$/i.test(formData.email)) {
      newErrors.email = "Email must be in abc@gmail.com format";
    }
    
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone must be exactly 10 digits";
    }
    
    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 18) {
        newErrors.dateOfBirth = "You must be at least 18 years old";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    setApiError("");
    
    try {
      // FIX: Added '/profile' to the API path
      const response = await axios.put(`/api/users/profile/${id}`, formData);
      
      navigate(`/patient-profile/${id}`, {
        state: {
          patient: response.data.data,
          message: "Profile updated successfully!",
        },
      });
    } catch (err) {
      console.error("Error updating patient:", err);
      setApiError(err.response?.data?.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // Calculate max date for date input (18 years ago from today)
  const getMaxDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date.toISOString().split("T")[0];
  };

  if (loading && !formData.name) {
    return <div className="profile-container"><div className="profile-card">Loading patient data...</div></div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>Edit Profile</h2>
        
        {apiError && <div className="error-message">{apiError}</div>}
        
        <form onSubmit={handleSave}>
          <div className="profile-info">
            {fields.map((field) => (
              <div className="info-item" key={field.name}>
                <label>{field.label}:</label>
                
                {field.type === "select" ? (
                  <select
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    required={field.required}
                    disabled={loading}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    required={field.required}
                    disabled={field.disabled || loading}
                    maxLength={field.maxLength}
                    pattern={field.pattern}
                    max={field.type === "date" ? getMaxDate() : undefined}
                  />
                )}
                
                {errors[field.name] && (
                  <span className="error">{errors[field.name]}</span>
                )}
              </div>
            ))}
          </div>
          
          <div className="edit-buttons" style={{ marginTop: "20px" }}>
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
            <button 
              type="button" 
              onClick={handleCancel} 
              style={{ marginLeft: "10px" }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPatientProfile;