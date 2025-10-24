import React, { useState } from "react";
import "./App.css";
import DashboardPage from "./DashboardPage";
import AppointmentsPage from "./AppointmentsPage";
import AdminPage from "./AdminPage";
import MyAppointments from "./MyAppointments";
import RegisterPage from "./RegisterPage";
import Notifications from "./Notifications";

function App() {
  const [currentPage, setCurrentPage] = useState("login");
  const [userRole, setUserRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ✅ Backend base URL (for production + local use)
  const API_BASE_URL =
    process.env.REACT_APP_API_URL || "https://healthstack-1.onrender.com";

  // --- LOGIN HANDLER ---
  const handleLogin = async (role) => {
    try {
      const res = await fetch("https://healthstack-1.onrender.com/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid login credentials");

      setUserRole(data.role);
      setCurrentPage("dashboard");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  // --- LOGOUT HANDLER ---
  const handleLogout = () => {
    setUserRole("");
    setEmail("");
    setPassword("");
    setCurrentPage("login");
  };

  // --- LOGIN SCREEN ---
  if (!userRole && currentPage === "login") {
    return (
      <div className="login-screen">
        <div className="login-box">
          <h1>Welcome to HealthStack 🏥</h1>
          <p>Please log in to continue</p>

          {error && <div className="error-message">{error}</div>}

          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="login-buttons">
            <button className="btn-patient" onClick={() => handleLogin("patient")}>
              Login as Patient
            </button>
            <button className="btn-doctor" onClick={() => handleLogin("doctor")}>
              Login as Doctor
            </button>
          </div>

          <div className="register-link">
            Don’t have an account?{" "}
            <a onClick={() => setCurrentPage("register")}>Register here</a>
          </div>
        </div>
      </div>
    );
  }

  // --- REGISTER PAGE ---
  if (currentPage === "register") {
    return <RegisterPage onRegisterSuccess={() => setCurrentPage("login")} />;
  }

  // --- MAIN APP (AFTER LOGIN) ---
  return (
    <div className="health-app">
      <header className="app-header">
        <div className="header-logo">HealthStack</div>

        <div className="header-search">
          <input type="text" placeholder="What are you looking for?" />
          <button>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
            </svg>
          </button>
        </div>

        <nav className="header-nav">
          <ul>
            <li>
              <button
                onClick={() => setCurrentPage("dashboard")}
                className={currentPage === "dashboard" ? "active" : ""}
              >
                Dashboard
              </button>
            </li>

            {/* Patient navigation */}
            {userRole === "patient" && (
              <>
                <li>
                  <button
                    onClick={() => setCurrentPage("appointments")}
                    className={currentPage === "appointments" ? "active" : ""}
                  >
                    Appointments
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentPage("myAppointments")}
                    className={currentPage === "myAppointments" ? "active" : ""}
                  >
                    My Appointments
                  </button>
                </li>
              </>
            )}

            {/* Doctor navigation */}
            {userRole === "doctor" && (
              <li>
                <button
                  onClick={() => setCurrentPage("admin")}
                  className={currentPage === "admin" ? "active" : ""}
                >
                  Admin View
                </button>
              </li>
            )}

            <li>
              <button
                onClick={() => setCurrentPage("notifications")}
                className={currentPage === "notifications" ? "active" : ""}
              >
                Notifications
              </button>
            </li>
          </ul>
        </nav>

        <div className="header-actions">
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="main-content">
        {currentPage === "dashboard" && <DashboardPage />}

        {userRole === "patient" && currentPage === "appointments" && (
          <AppointmentsPage />
        )}

        {userRole === "patient" && currentPage === "myAppointments" && (
          <MyAppointments />
        )}

        {userRole === "doctor" && currentPage === "admin" && <AdminPage />}
        {currentPage === "notifications" && (
          <Notifications userEmail={email} />
        )}
      </main>
    </div>
  );
}

export default App;
