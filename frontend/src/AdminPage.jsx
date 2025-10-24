// --- This is the complete, correct code for AdminPage.jsx --- //

import React, { useState, useEffect, useCallback } from 'react';
import './App.css'; // Connects the main stylesheet

const API_URL = "http://localhost:3001/api";

const AdminPage = () => {
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAppointments = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/appointments`);
            if (!response.ok) throw new Error('Failed to fetch appointments.');
            const result = await response.json();
            setAppointments(result.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await fetch(`${API_URL}/appointments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            // Refresh the list automatically after updating
            fetchAppointments();
        } catch (err) {
            console.error("Failed to update status:", err);
            setError("Could not update appointment status.");
        }
    };

    if (isLoading) return <p style={{textAlign: 'center', padding: '2rem'}}>Loading appointments...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div>
            <div className="dashboard-header">
                <h1>Doctor Dashboard</h1>
                <p>Viewing all patient appointment requests.</p>
            </div>
            <div className="appointments-list-container">
                <table className="appointments-table">
                    <thead>
                        <tr>
                            <th>Patient Symptoms</th>
                            <th>Date & Time</th>
                            <th>Doctor</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.length > 0 ? (
                            appointments.map(appt => (
                                <tr key={appt._id}>
                                    <td>{appt.symptoms}</td>
                                    <td>{appt.date} at {appt.time}</td>
                                    <td>{appt.doctor}</td>
                                    <td>
                                        <span className={`status-badge status-${appt.status?.toLowerCase()}`}>
                                            {appt.status}
                                        </span>
                                    </td>
                                    <td className="action-buttons">
                                        <button className="btn-accept" onClick={() => handleUpdateStatus(appt._id, 'Accepted')}>Accept</button>
                                        <button className="btn-decline" onClick={() => handleUpdateStatus(appt._id, 'Declined')}>Decline</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{textAlign: 'center'}}>No appointments have been booked yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPage;