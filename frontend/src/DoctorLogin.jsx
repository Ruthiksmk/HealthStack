import React, { useState } from 'react';

const DoctorLogin = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password, 'doctor');
  };

  return (
    <div className="login-screen">
      <div className="login-box">
        <h2>Doctor Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-signup">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default DoctorLogin;
