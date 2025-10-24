// backend/routes/emergency_proximity.js
const express = require('express');
const router = express.Router();

// Haversine distance in meters
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => deg * Math.PI / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// POST /api/emergency/location
// body: { email, location: { lat, lng } }
router.post('/location', async (req, res) => {
  try {
    const { email, location } = req.body;
    if (!email || !location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return res.status(400).json({ error: 'email and numeric location required' });
    }

    const db = req.app.locals.db;
    if (!db) return res.status(500).json({ error: 'DB not initialised on server' });

    await db.collection('users').updateOne(
      { email },
      { $set: { lastLocation: { lat: location.lat, lng: location.lng }, lastSeen: new Date() } },
      { upsert: false }
    );

    return res.json({ message: 'Location saved' });
  } catch (err) {
    console.error('Error saving location', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/emergency/sos
// body: { patientEmail, patientName, location: { lat, lng } }
router.post('/sos', async (req, res) => {
  try {
    const { patientEmail, patientName, location } = req.body;
    if (!patientEmail || !location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return res.status(400).json({ error: 'patientEmail and numeric location required' });
    }

    const db = req.app.locals.db;
    const transporter = req.app.locals.transporter;
    if (!db) return res.status(500).json({ error: 'DB not initialised on server' });
    if (!transporter) return res.status(500).json({ error: 'Email transporter not configured' });

    // 1) fetch saved emergency contacts for patientEmail
    const contactsDoc = await db.collection('emergencycontacts').findOne({ patientEmail });
    if (!contactsDoc || !Array.isArray(contactsDoc.contacts) || contactsDoc.contacts.length === 0) {
      return res.status(404).json({ error: 'No emergency contacts found' });
    }
    const contactEmails = contactsDoc.contacts.map(c => c.email).filter(Boolean);
    if (contactEmails.length === 0) return res.status(404).json({ error: 'No valid contact emails' });

    // 2) look up contact users in users collection to get lastLocation and lastSeen
    const users = await db.collection('users').find({ email: { $in: contactEmails } }).toArray();

    // 3) filter by recent lastSeen (10 minutes) and compute distances
    const MAX_AGE_MINUTES = 10;
    const cutoff = new Date(Date.now() - MAX_AGE_MINUTES * 60 * 1000);

    const candidates = users
      .filter(u => u.lastLocation && u.lastSeen && new Date(u.lastSeen) >= cutoff)
      .map(u => {
        const d = haversineDistanceMeters(location.lat, location.lng, u.lastLocation.lat, u.lastLocation.lng);
        return { email: u.email, name: u.name || '', dist: d, lastSeen: u.lastSeen };
      })
      .sort((a,b) => a.dist - b.dist);

    // 4) choose those within radius, else choose the closest one
    const RADIUS_METERS = 500;
    let selected = candidates.filter(c => c.dist <= RADIUS_METERS).slice(0, 5);
    if (selected.length === 0 && candidates.length > 0) selected = [candidates[0]];

    if (selected.length === 0) {
      return res.status(404).json({ error: 'No nearby responders available' });
    }

    // 5) send email
    const toEmails = selected.map(s => s.email).join(',');
    const subject = `🚨 SOS: ${patientName || patientEmail} needs help`;
    const mapLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    const text = `${patientName || patientEmail} has triggered an SOS.\n\nLocation: ${location.lat}, ${location.lng}\nMap: ${mapLink}\n\nPlease check immediately.`;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: toEmails,
      subject,
      text,
    });

    console.log('SOS emails sent to:', toEmails, 'info:', info?.response || info);
    return res.json({ message: 'SOS notifications sent', notified: selected });
  } catch (err) {
    console.error('Error handling SOS:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
