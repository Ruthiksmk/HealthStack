// // frontend/src/components/EmergencyContacts.jsx
// import React, { useState, useEffect } from 'react';

// const API = 'http://localhost:3001/api';

// export default function EmergencyContacts({ patientEmail, patientName }) {
//   const [input, setInput] = useState('');
//   const [contacts, setContacts] = useState([]);
//   const [loading, setLoading] = useState(false);

//   async function load() {
//     if (!patientEmail) return;
//     try {
//       setLoading(true);
//       const res = await fetch(`${API}/emergency?patientEmail=${encodeURIComponent(patientEmail)}`);
//       const json = await res.json();
//       setContacts(json.contacts || []);
//     } catch (err) {
//       console.error('Fetch contacts error', err);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => { load(); }, [patientEmail]);

//   async function addContact(e) {
//     e?.preventDefault?.();
//     if (!input) return alert('Enter email to add');
//     try {
//       const res = await fetch(`${API}/emergency`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ patientEmail, email: input })
//       });
//       const json = await res.json();
//       if (!res.ok) return alert(json.error || json.message || 'Failed to add');
//       setContacts(json.contacts || []);
//       setInput('');
//     } catch (err) {
//       console.error('Add contact error', err);
//       alert('Failed to add contact');
//     }
//   }

//   async function removeContact(email) {
//     if (!confirm(`Remove ${email}?`)) return;
//     try {
//       const res = await fetch(`${API}/emergency`, {
//         method: 'DELETE',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ patientEmail, email })
//       });
//       const json = await res.json();
//       if (!res.ok) return alert(json.error || json.message || 'Failed to delete');
//       setContacts(json.contacts || []);
//     } catch (err) {
//       console.error('Delete contact error', err);
//       alert('Failed to delete contact');
//     }
//   }

//   return (
//     <div style={{ padding: 12 }}>
//       <h3>🚨 Emergency Contacts</h3>

//       <form onSubmit={addContact} style={{ marginBottom: 12 }}>
//         <input
//           type="email" placeholder="contact@example.com"
//           value={input} onChange={(e) => setInput(e.target.value)}
//           style={{ padding: 8, width: 260 }} required
//         />
//         <button style={{ marginLeft: 8 }} type="submit">Add</button>
//       </form>

//       {loading ? <div>Loading…</div> : (
//         contacts.length === 0
//           ? <div>No saved contacts.</div>
//           : (
//             <ul>
//               {contacts.map((c) => (
//                 <li key={c._id || c.email}>
//                   {c.email}
//                   <button style={{ marginLeft: 8 }} onClick={() => removeContact(c.email)}>Remove</button>
//                 </li>
//               ))}
//             </ul>
//           )
//       )}

//       {/* <div style={{ marginTop: 12 }}>
//         <button
//           onClick={async () => {
//             if (!contacts.length) return alert('No contacts to notify');
//             if (!navigator.geolocation) return alert('Geolocation not supported');
//             navigator.geolocation.getCurrentPosition(async (pos) => {
//               const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
//               const res = await fetch(`${API}/emergency/sos`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ patientEmail, patientName, location })
//               });
//               const json = await res.json();
//               alert(json.message || json.error || 'SOS attempt done');
//             });
//           }}
//         >
//           Send SOS
//         </button>
//       </div> */}
//       <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
//   <button
//     onClick={async () => {
//       if (!contacts.length) return alert('No contacts to notify');
//       if (!navigator.geolocation) return alert('Geolocation not supported');

//       navigator.geolocation.getCurrentPosition(async (pos) => {
//         const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
//         try {
//           const res = await fetch(`${API}/emergency/sos`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ patientEmail, patientName, location }),
//           });
//           const json = await res.json();
//           alert(json.message || json.error || 'SOS attempt done');
//         } catch (err) {
//           console.error('SOS Error:', err);
//           alert('Failed to send SOS');
//         }
//       });
//     }}
//     style={{
//       backgroundColor: 'red',
//       color: 'white',
//       borderRadius: '50%',
//       width: '70px',
//       height: '70px',
//       fontSize: '18px',
//       fontWeight: 'bold',
//       border: 'none',
//       cursor: 'pointer',
//       boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
//       transition: 'transform 0.2s ease, box-shadow 0.2s ease',
//     }}
//     onMouseEnter={(e) => {
//       e.target.style.transform = 'scale(1.1)';
//       e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
//     }}
//     onMouseLeave={(e) => {
//       e.target.style.transform = 'scale(1)';
//       e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
//     }}
//   >
//     SOS
//   </button>
// </div>

//     </div>
//   );
// }

// frontend/src/components/EmergencyContacts.jsx
import React, { useState, useEffect } from 'react';

const API = 'http://localhost:3001/api';

export default function EmergencyContacts({ patientEmail, patientName }) {
  const [emailInput, setEmailInput] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  // ---------------- Load Contacts ----------------
  async function load() {
    if (!patientEmail) return;
    try {
      setLoading(true);
      const res = await fetch(`${API}/emergency?patientEmail=${encodeURIComponent(patientEmail)}`);
      const json = await res.json();
      setContacts(json.contacts || []);
    } catch (err) {
      console.error('Fetch contacts error', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [patientEmail]);

  // ---------------- Add Contact ----------------
  async function handleAddContact(e) {
    e?.preventDefault?.();
    if (!emailInput) return alert('Enter email to add');
    try {
      const res = await fetch(`${API}/emergency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientEmail, email: emailInput })
      });
      const json = await res.json();
      if (!res.ok) return alert(json.error || json.message || 'Failed to add');
      setContacts(json.contacts || []);
      setEmailInput('');
    } catch (err) {
      console.error('Add contact error', err);
      alert('Failed to add contact');
    }
  }

  // ---------------- Remove Contact ----------------
  async function handleRemoveContact(email) {
    if (!confirm(`Remove ${email}?`)) return;
    try {
      const res = await fetch(`${API}/emergency`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientEmail, email })
      });
      const json = await res.json();
      if (!res.ok) return alert(json.error || json.message || 'Failed to delete');
      setContacts(json.contacts || []);
    } catch (err) {
      console.error('Delete contact error', err);
      alert('Failed to delete contact');
    }
  }

  // ---------------- Send SOS ----------------
  async function handleSendSOS() {
    if (!contacts.length) return alert('No contacts to notify');
    if (!navigator.geolocation) return alert('Geolocation not supported');

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      try {
        const res = await fetch(`${API}/emergency/sos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientEmail, patientName, location }),
        });
        const json = await res.json();
        alert(json.message || json.error || 'SOS attempt done');
      } catch (err) {
        console.error('SOS Error:', err);
        alert('Failed to send SOS');
      }
    });
  }

  // ---------------- UI ----------------
  return (
    <div style={{ padding: 12 }}>
      <h3>🚨 Emergency Contacts</h3>

      {/* ✅ NEW: Styled container */}
      <div className="emergency-container">
        <h2>Emergency Contacts</h2>
        <div className="emergency-input">
          <input
            type="email"
            value={emailInput}
            placeholder="Enter contact email"
            onChange={(e) => setEmailInput(e.target.value)}
          />
          <button onClick={handleAddContact}>Add</button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul className="emergency-list">
            {contacts.map((c, i) => (
              <li key={i}>
                <span>{c.contactEmail || c.email}</span>
                <button onClick={() => handleRemoveContact(c.contactEmail || c.email)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sos-floating-btn">
  <button
    onClick={async () => {
      if (!contacts.length) return alert('No contacts to notify');
      if (!navigator.geolocation) return alert('Geolocation not supported');

      navigator.geolocation.getCurrentPosition(async (pos) => {
        const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        try {
          const res = await fetch(`${API}/emergency/sos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patientEmail, patientName, location }),
          });
          const json = await res.json();
          alert(json.message || json.error || 'SOS attempt done');
        } catch (err) {
          console.error('SOS Error:', err);
          alert('Failed to send SOS');
        }
      });
    }}
  >
    SOS
  </button>
</div>

    </div>
  );
}
