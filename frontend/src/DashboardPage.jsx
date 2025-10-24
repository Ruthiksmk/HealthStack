import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import EmergencyContacts from './components/EmergencyContacts';


const API_URL = 'http://localhost:3001/api';

// Helper function to get date string
const getDateString = (date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split('T')[0];
};

function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(getDateString(new Date()));
  const [water, setWater] = useState(0);
  const [activities, setActivities] = useState([]);
  const [sleep, setSleep] = useState(0);
  const [allData, setAllData] = useState([]);
  const [error, setError] = useState('');

  const [activityName, setActivityName] = useState('');
  const [activityDuration, setActivityDuration] = useState('');

  // ✅ SOS & Emergency state
  const [emergencyEmails, setEmergencyEmails] = useState([]);
  const [newEmergencyEmail, setNewEmergencyEmail] = useState('');
  const [sosSending, setSosSending] = useState(false);

  const resetActivityFields = () => {
    setActivityName('');
    setActivityDuration('');
  };

  const activityTotal = activities.reduce((sum, act) => sum + act.duration, 0);

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const response = await fetch(`${API_URL}/wellness`);
      if (!response.ok) throw new Error('Could not fetch data');

      const result = await response.json();
      const currentEntry = result.data.find((d) => d.date === selectedDate);

      if (currentEntry) {
        setWater(currentEntry.water || 0);
        let parsedActivities = [];
        try {
          if (currentEntry.exercise) parsedActivities = JSON.parse(currentEntry.exercise);
        } catch (e) {}
        setActivities(Array.isArray(parsedActivities) ? parsedActivities : []);
        setSleep(currentEntry.sleep || 0);
      } else {
        setWater(0);
        setActivities([]);
        setSleep(0);
      }
      setAllData(result.data);
    } catch (err) {
      console.error(err);
      setError('Failed to connect to the server. Is it running?');
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
    fetchEmergencyEmails();
  }, [fetchData]);

  // ✅ Fetch emergency contacts
  const fetchEmergencyEmails = async () => {
    try {
      const res = await fetch(`${API_URL}/emergency?patientEmail=ruthiksmkbodicherla@gmail.com`);
      const data = await res.json();
      setEmergencyEmails(data.data || []);
    } catch (err) {
      console.error('Error fetching emergency contacts:', err);
    }
  };

  // ✅ Add emergency contact
  const addEmergencyEmail = async (e) => {
    e.preventDefault();
    if (!newEmergencyEmail.trim()) return;

    try {
      const res = await fetch(`${API_URL}/emergency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientEmail: 'ruthiksmkbodicherla@gmail.com',
          email: newEmergencyEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to add contact');
        return;
      }

      setNewEmergencyEmail('');
      fetchEmergencyEmails();
    } catch (err) {
      console.error('Error adding contact:', err);
      alert('Error adding contact. Check server connection.');
    }
  };

  // ✅ Delete contact
  const deleteEmergencyEmail = async (email) => {
    try {
      await fetch(`${API_URL}/emergency`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientEmail: 'ruthiksmkbodicherla@gmail.com',
          email,
        }),
      });
      fetchEmergencyEmails();
    } catch (err) {
      console.error('Error deleting contact:', err);
    }
  };

  // ✅ Send SOS
  const sendSOS = async () => {
    if (emergencyEmails.length === 0) {
      alert('No emergency contacts saved!');
      return;
    }

    setSosSending(true);
    if (!navigator.geolocation) {
      alert('Geolocation not supported.');
      setSosSending(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };

      try {
        const res = await fetch(`${API_URL}/emergency/sos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientEmail: 'ruthiksmkbodicherla@gmail.com',
            patientName: 'John Doe',
            location,
          }),
        });

        const data = await res.json();
        alert(data.message || 'SOS sent!');
      } catch (err) {
        alert('Failed to send SOS.');
      } finally {
        setSosSending(false);
      }
    });
  };

  const saveData = useCallback(
    async (newData) => {
      try {
        const dataToSave = {
          date: selectedDate,
          water: newData.water !== undefined ? newData.water : water,
          exercise: newData.activities !== undefined ? newData.activities : activities,
          sleep: newData.sleep !== undefined ? newData.sleep : sleep,
        };

        await fetch(`${API_URL}/wellness`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave),
        });
        await fetchData();
      } catch (err) {
        console.error(err);
        setError('Could not save data.');
      }
    },
    [selectedDate, water, activities, sleep, fetchData]
  );

  const handleWaterChange = (amount) => {
    const newWater = Math.max(0, water + amount);
    setWater(newWater);
    saveData({ water: newWater });
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    const description = activityName.trim();
    const duration = parseInt(activityDuration, 10);

    if (description && !isNaN(duration) && duration > 0) {
      const newActivity = { id: Date.now(), description, duration };
      const newActivities = [...activities, newActivity];
      setActivities(newActivities);
      await saveData({ activities: newActivities });
      resetActivityFields();
    }
  };

  const handleSleepSubmit = (e) => {
    e.preventDefault();
    const hours = parseFloat(e.target.elements.hours.value);
    if (!isNaN(hours) && hours > 0) {
      setSleep(hours);
      saveData({ sleep: hours });
      e.target.reset();
    }
  };

  const handleSeedData = async () => {
    try {
      setError('');
      await fetch(`${API_URL}/seed`, { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error(err);
      setError('Could not generate sample data.');
    }
  };

  const formattedDate = new Date(selectedDate.replace(/-/g, '/')).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>{formattedDate}</p>
        </div>
        <div className="date-controls">
          <input
            type="date"
            className="date-picker"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button className="btn-seed" onClick={handleSeedData}>
            Generate Sample Data
          </button>
        </div>
      </div>

      <div className="trackers-grid">
        {/* 💧 Hydration */}
        <div className="tracker-card">
          <div className="card-header">
            <h2>💧 Hydration</h2>
          </div>
          <div className="card-body">
            <p>Log your water intake for today. Goal: 8 glasses.</p>
            <div className="hydration-controls">
              <button onClick={() => handleWaterChange(-1)}>-</button>
              <span className="count">{water}</span>
              <button onClick={() => handleWaterChange(1)}>+</button>
            </div>
          </div>
        </div>

        {/* 🏃‍♂️ Physical Activity */}
        <div className="tracker-card">
          <div className="card-header">
            <h2>🏃‍♂️ Physical Activity</h2>
          </div>
          <div className="card-body">
            <form className="activity-form" onSubmit={handleActivitySubmit}>
              <input
                type="text"
                placeholder="e.g., Morning Run"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                required
              />
              <div className="form-row">
                <input
                  type="number"
                  placeholder="Duration (min)"
                  value={activityDuration}
                  onChange={(e) => setActivityDuration(e.target.value)}
                  required
                />
                <button type="submit">Add</button>
              </div>
            </form>
            <ul className="activity-list">
              {activities.map((act) => (
                <li key={act.id}>
                  <span className="description">{act.description}</span>
                  <span className="duration">{act.duration} min</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="total-display">
            Today's Total: <span>{activityTotal} min</span>
          </div>
        </div>

        {/* 😴 Sleep */}
        <div className="tracker-card">
          <div className="card-header">
            <h2>😴 Sleep Cycle</h2>
          </div>
          <div className="card-body">
            <p>Log your total sleep time.</p>
            <form className="sleep-form" onSubmit={handleSleepSubmit}>
              <input type="number" name="hours" placeholder="Hours" step="0.1" />
              <button type="submit">Save</button>
            </form>
            <div className="total-display">
              Last Night: <span>{sleep} hrs</span>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Emergency Contacts Component (modularized version) */}
      <EmergencyContacts
          patientEmail="ruthiksmkbodicherla@gmail.com"
          patientName="Ruthik Bodicherla"
      />

      {/* <EmergencyContacts patientEmail={userEmail} patientName={userName} /> */}

      
    </>
  );
}

export default DashboardPage;
