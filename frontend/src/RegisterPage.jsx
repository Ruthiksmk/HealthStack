import React, { useState } from "react";
import "./App.css"; // Make sure CSS styles are loaded

function RegisterPage({ onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch("http://localhost:3001/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setSuccess("✅ Registered successfully! Redirecting to login...");
      setTimeout(() => onRegisterSuccess && onRegisterSuccess(), 1300);
    } catch (err) {
      setError(err.message || "Server error");
    }
  };

  return (
    <div className="login-screen">
      <div className="login-box">
        <h1>
          Register on <span style={{ color: "#00796b" }}>HealthStack</span>
        </h1>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-msg">{success}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <input
            name="name"
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {/* Aligned row for select + button */}
          <div className="form-row">
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>

            <button type="submit" className="btn-register">
              Register
            </button>
          </div>
        </form>

        <p style={{ marginTop: 18 }}>
          Already registered?{" "}
          <button
            onClick={() => onRegisterSuccess && onRegisterSuccess()}
            className="link-btn"
          >
            Login here
          </button>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
