import React, { useState } from 'react';
import './AppointmentsPage.css'; // This connects the CSS file for this page

const API_URL = 'http://localhost:3001/api';

// This is the complete sample data with doctors for each department
const sampleData = [
    { 
        id: 1, 
        name: 'Apollo Hospital, Chennai',
        departments: [
            { id: 101, name: 'Cardiology - Heart-related issues', doctors: ['Dr. Kumar', 'Dr. Priya Sharma'] },
            { id: 102, name: 'Orthopedics - Bone and joint issues', doctors: ['Dr. Arjun Reddy', 'Dr. Anjali Rao'] },
            { id: 103, name: 'Gynaecology - Women\'s health', doctors: ['Dr. Meena Iyer', 'Dr. Sunita Gupta'] },
        ]
    },
    { 
        id: 2, 
        name: 'Fortis Hospital, Bengaluru',
        departments: [
            { id: 201, name: 'Neurology - Brain and nerve issues', doctors: ['Dr. Vikram Singh', 'Dr. Aisha Khan'] },
            { id: 202, name: 'Pediatrics - Child health', doctors: ['Dr. Rahul Verma', 'Dr. Sneha Patel'] },
            { id: 203, name: 'Dermatology - Skin issues', doctors: ['Dr. Fatima Ahmed', 'Dr. Rajesh Kumar'] },
        ]
    },
    { 
        id: 3, 
        name: 'AIIMS, New Delhi',
        departments: [
            { id: 301, name: 'Cardiology - Heart-related issues', doctors: ['Dr. Alok Nath', 'Dr. Preeti Singh'] },
            { id: 302, name: 'Oncology - Cancer treatment', doctors: ['Dr. Mohan Agashe', 'Dr. Rina Shah'] },
            { id: 303, name: 'Gastroenterology - Digestive system', doctors: ['Dr. Anil Kapoor', 'Dr. Divya Sharma'] },
        ]
    },
];

function AppointmentsPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isBookingSuccess, setIsBookingSuccess] = useState(false);
    const [appointmentDetails, setAppointmentDetails] = useState({
        hospitalId: '',
        symptoms: '',
        departmentId: '',
        doctorId: '',
        date: '',
        time: '',
    });

    const handleNextStep = () => setCurrentStep(prev => prev + 1);
    const handlePrevStep = () => setCurrentStep(prev => prev - 1);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setAppointmentDetails(prev => ({ ...prev, [name]: value }));
        // Reset dependent fields when a higher-level selection changes
        if (name === 'hospitalId') {
            setAppointmentDetails(prev => ({ ...prev, departmentId: '', doctorId: '' }));
        }
        if (name === 'departmentId') {
            setAppointmentDetails(prev => ({ ...prev, doctorId: '' }));
        }
    };

    const selectedHospital = sampleData.find(h => h.id === parseInt(appointmentDetails.hospitalId));
    const selectedDepartment = selectedHospital?.departments.find(d => d.id === parseInt(appointmentDetails.departmentId));

    const handleConfirm = async () => {
        const finalDetails = {
            hospital: selectedHospital?.name,
            department: selectedDepartment?.name,
            doctor: appointmentDetails.doctorId,
            date: appointmentDetails.date,
            time: appointmentDetails.time,
            symptoms: appointmentDetails.symptoms,
            patientEmail: localStorage.getItem('patientEmail') || appointmentDetails.patientEmail || 'guest@example.com'
        };
        try {
            const response = await fetch(`${API_URL}/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalDetails),
            });
            if (!response.ok) throw new Error('Booking failed.');
            setIsBookingSuccess(true); // This will trigger the success message
        } catch (error) {
            console.error("Booking Error:", error);
            // You can add an error message to the user here if you like
        }
    };
    // --- Add this new component after the AppointmentsPage component --- //

// --- Doctor Dashboard Component ---
const DoctorDashboard = () => {
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
            // Refresh the list after updating
            fetchAppointments();
        } catch (err) {
            console.error("Failed to update status:", err);
            setError("Could not update appointment status.");
        }
    };

    if (isLoading) return <p>Loading appointments...</p>;
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

    // This block shows the success message after booking is complete
    if (isBookingSuccess) {
        return (
            <div className="appointment-form-container">
                <div className="form-step" style={{ textAlign: 'center' }}>
                    <h3>✅ Appointment Confirmed!</h3>
                    <p>Your appointment request has been sent successfully.</p>
                    <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>The hospital's administration will contact you shortly to confirm.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="dashboard-header">
                <h1>Book an Appointment</h1>
                <p>Follow the steps below to schedule your visit.</p>
            </div>
            
            <div className="appointment-form-container">
                <div className="progress-bar">
                    <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>Hospital</div>
                    <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>Symptoms & Dept</div>
                    <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>Doctor & Time</div>
                    <div className={`progress-step ${currentStep >= 4 ? 'active' : ''}`}>Confirm</div>
                </div>

                {currentStep === 1 && (
                    <div className="form-step">
                        <h3>Step 1: Select a Hospital</h3>
                        <label className="form-label" htmlFor="hospital-select">Choose a hospital</label>
                        <select id="hospital-select" className="form-select" name="hospitalId" value={appointmentDetails.hospitalId} onChange={handleInputChange}>
                            <option value="" disabled>-- Please choose a hospital --</option>
                            {sampleData.map(hospital => (<option key={hospital.id} value={hospital.id}>{hospital.name}</option>))}
                        </select>
                    </div>
                )}
                
                {currentStep === 2 && (
                     <div className="form-step">
                        <h3>Step 2: Describe Symptoms & Select Department</h3>
                        <label className="form-label" htmlFor="symptoms">Describe your symptoms</label>
                        <textarea id="symptoms" name="symptoms" className="form-textarea" value={appointmentDetails.symptoms} onChange={handleInputChange} placeholder="e.g., I have been experiencing a persistent dry cough..."></textarea>
                        <div className="ai-suggester"><a href="YOUR_STREAMLIT_APP_URL_HERE" target="_blank" rel="noopener noreferrer" className="btn-ai-link">Analyze Symptoms with our Advanced AI Tool</a><p className="ai-note">This will open our analysis tool in a new tab. Use it to help you choose the correct department below.</p></div>
                        <label className="form-label" htmlFor="department-select" style={{marginTop: '1.5rem'}}>Select a department at {selectedHospital?.name}</label>
                        <select id="department-select" className="form-select" name="departmentId" value={appointmentDetails.departmentId} onChange={handleInputChange} disabled={!selectedHospital}>
                            <option value="" disabled>-- Please choose a department --</option>
                            {selectedHospital?.departments.map(dept => (<option key={dept.id} value={dept.id}>{dept.name}</option>))}
                        </select>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="form-step">
                        <h3>Step 3: Select a Doctor & Appointment Time</h3>
                        <label className="form-label" htmlFor="doctor-select">Choose a doctor from {selectedDepartment?.name.split(' - ')[0]}</label>
                        <select id="doctor-select" className="form-select" name="doctorId" value={appointmentDetails.doctorId} onChange={handleInputChange} disabled={!selectedDepartment}>
                            <option value="" disabled>-- Select a doctor --</option>
                            {selectedDepartment?.doctors.map(doctor => (<option key={doctor} value={doctor}>{doctor}</option>))}
                        </select>
                        <div className="time-selection-grid">
                            <div>
                                <label className="form-label" htmlFor="date-select">Select a date</label>
                                <input type="date" id="date-select" name="date" className="form-select" value={appointmentDetails.date} onChange={handleInputChange}/>
                            </div>
                            <div>
                                <label className="form-label" htmlFor="time-select">Select a time</label>
                                <select id="time-select" className="form-select" name="time" value={appointmentDetails.time} onChange={handleInputChange}>
                                    <option value="" disabled>-- Select a time --</option>
                                    <option value="09:00 AM">09:00 AM</option>
                                    <option value="10:00 AM">10:00 AM</option>
                                    <option value="11:00 AM">11:00 AM</option>
                                    <option value="02:00 PM">02:00 PM</option>
                                    <option value="03:00 PM">03:00 PM</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
                
                {currentStep === 4 && (
                    <div className="form-step">
                        <h3>Step 4: Confirm Your Appointment</h3>
                        <ul className="confirmation-details">
                            <li><span className="label">Hospital</span><span className="value">{selectedHospital?.name}</span></li>
                            <li><span className="label">Department</span><span className="value">{selectedDepartment?.name}</span></li>
                            <li><span className="label">Doctor</span><span className="value">{appointmentDetails.doctorId}</span></li>
                            <li><span className="label">Date & Time</span><span className="value">{appointmentDetails.date} at {appointmentDetails.time}</span></li>
                            <li><span className="label">Symptoms</span><span className="value">{appointmentDetails.symptoms}</span></li>
                        </ul>
                    </div>
                )}

                <div className="form-navigation">
                    <button onClick={handlePrevStep} disabled={currentStep === 1}>Back</button>
                    {currentStep < 4 ? (
                        <button className="btn-next" onClick={handleNextStep} disabled={
                            (currentStep === 1 && !appointmentDetails.hospitalId) ||
                            (currentStep === 2 && (!appointmentDetails.symptoms || !appointmentDetails.departmentId)) ||
                            (currentStep === 3 && (!appointmentDetails.doctorId || !appointmentDetails.date || !appointmentDetails.time))
                        }>
                            Next
                        </button>
                    ) : (
                        <button className="btn-next" onClick={handleConfirm}>Confirm Appointment</button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AppointmentsPage;

