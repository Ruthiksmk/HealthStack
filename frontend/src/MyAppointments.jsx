// MyAppointments.jsx
import React, { useState, useEffect } from 'react';
import './App.css'; // reuse your existing styles

const API_URL = 'http://localhost:3001/api';

function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Get the logged-in patient's email (replace this later with real auth)
  const patientEmail = localStorage.getItem('patientEmail') || 'guest@example.com';

  // Fetch only this patient's appointments
  const fetchMyAppointments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/appointments?patientEmail=${encodeURIComponent(patientEmail)}`);
      if (!response.ok) throw new Error('Failed to fetch your appointments.');
      const result = await response.json();
      setAppointments(result.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error fetching your appointments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAppointments();
    // Optional: refresh every 30 seconds to see live status updates
    const interval = setInterval(fetchMyAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  // Allow user to cancel pending appointments
  const handleCancel = async (id) => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this appointment?');
    if (!confirmCancel) return;
    try {
      const res = await fetch(`${API_URL}/appointments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to cancel appointment.');
      fetchMyAppointments(); // refresh after deletion
    } catch (err) {
      alert('Could not cancel appointment: ' + err.message);
    }
  };

  if (isLoading) return <p style={{ textAlign: 'center' }}>Loading your appointments...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <div className="dashboard-header">
        <h1>My Appointments</h1>
        <p>Welcome! Here are your booked appointments ({patientEmail})</p>
      </div>

      <div className="appointments-list-container">
        <table className="appointments-table">
          <thead>
            <tr>
              <th>Hospital</th>
              <th>Department</th>
              <th>Doctor</th>
              <th>Date & Time</th>
              <th>Symptoms</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {appointments.length > 0 ? (
              appointments.map(appt => (
                <tr key={appt._id}>
                  <td>{appt.hospital}</td>
                  <td>{appt.department}</td>
                  <td>{appt.doctor}</td>
                  <td>{appt.date} at {appt.time}</td>
                  <td style={{ maxWidth: '250px', whiteSpace: 'normal' }}>{appt.symptoms}</td>
                  <td>
                    <span className={`status-badge status-${appt.status?.toLowerCase()}`}>
                      {appt.status}
                    </span>
                  </td>
                  <td className="action-buttons">
                    {appt.status === 'Pending' ? (
                      <button className="btn-decline" onClick={() => handleCancel(appt._id)}>Cancel</button>
                    ) : (
                      <em style={{ color: '#6b7280' }}>—</em>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>No appointments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MyAppointments;
