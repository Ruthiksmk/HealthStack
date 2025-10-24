// backend/routes/emergency.js
const express = require('express');
const router = express.Router();
const EmergencyContact = require('../models/EmergencyContact');
const nodemailer = require('nodemailer'); // used for SOS (optional here)

//
// GET /api/emergency?patientEmail=someone@example.com
// returns { contacts: [...] }
//
router.get('/', async (req, res) => {
  try {
    const { patientEmail } = req.query;
    if (!patientEmail) return res.status(400).json({ error: 'patientEmail query required' });

    const doc = await EmergencyContact.findOne({ patientEmail }).lean();
    res.json({ contacts: doc ? doc.contacts : [] });
  } catch (err) {
    console.error('[emergency GET] error', err);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

//
// POST /api/emergency
// body: { patientEmail, email }
// adds email into the patient's contacts array (no dupes) and returns contacts
//
router.post('/', async (req, res) => {
  try {
    const { patientEmail, email } = req.body;
    if (!patientEmail || !email) return res.status(400).json({ error: 'patientEmail and email required' });

    // upsert doc
    let doc = await EmergencyContact.findOne({ patientEmail });
    if (!doc) {
      doc = new EmergencyContact({ patientEmail, contacts: [{ email }] });
    } else {
      // prevent duplicates
      const exists = doc.contacts.some(c => c.email.toLowerCase() === email.toLowerCase());
      if (!exists) doc.contacts.push({ email });
    }
    await doc.save();
    res.json({ message: 'Contact added', contacts: doc.contacts });
  } catch (err) {
    console.error('[emergency POST] error', err);
    res.status(500).json({ error: 'Failed to add contact' });
  }
});

//
// DELETE /api/emergency
// body: { patientEmail, email }
// removes contact
//
router.delete('/', async (req, res) => {
  try {
    const { patientEmail, email } = req.body;
    if (!patientEmail || !email) return res.status(400).json({ error: 'patientEmail and email required' });

    const doc = await EmergencyContact.findOne({ patientEmail });
    if (!doc) return res.status(404).json({ error: 'No contacts found' });

    doc.contacts = doc.contacts.filter(c => c.email.toLowerCase() !== email.toLowerCase());
    await doc.save();
    res.json({ message: 'Contact removed', contacts: doc.contacts });
  } catch (err) {
    console.error('[emergency DELETE] error', err);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

//
// POST /api/emergency/sos
// body: { patientEmail, patientName, location: {lat,lng} }
// sends SOS email to saved contacts (nodemailer must be configured in env)
//
router.post('/sos', async (req, res) => {
  try {
    const { patientEmail, patientName, location } = req.body;
    if (!patientEmail) return res.status(400).json({ error: 'patientEmail required' });

    const doc = await EmergencyContact.findOne({ patientEmail }).lean();
    if (!doc || !doc.contacts || doc.contacts.length === 0) {
      return res.status(404).json({ error: 'No emergency contacts found' });
    }

    // build message
    const mapLink = location && location.lat && location.lng
      ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
      : 'Location not provided';

    const toList = doc.contacts.map(c => c.email).join(',');
    const subject = `🚨 SOS from ${patientName || patientEmail}`;
    const text = `Emergency alert!\n\nSender: ${patientName || patientEmail}\nEmail: ${patientEmail}\nLocation: ${mapLink}\n\nPlease check immediately.`;

    // send mail if EMAIL_USER/PASS configured (optional)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });
      await transporter.sendMail({ from: process.env.EMAIL_USER, to: toList, subject, text });
      console.log('[SOS] email sent to', toList);
      return res.json({ message: 'SOS sent by email' });
    } else {
      console.log('[SOS] EMAIL creds missing, would send to:', toList, 'subject:', subject, 'text:', text);
      return res.json({ message: 'SOS prepared but EMAIL credentials missing on server' });
    }

  } catch (err) {
    console.error('[emergency SOS] error', err);
    res.status(500).json({ error: 'Failed to send SOS' });
  }
});

module.exports = router;
