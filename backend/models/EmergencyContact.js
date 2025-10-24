// backend/models/EmergencyContact.js
const mongoose = require('mongoose');

const ContactSubSchema = new mongoose.Schema({
  email: { type: String, required: true }
}, { _id: true });

const EmergencyContactSchema = new mongoose.Schema({
  patientEmail: { type: String, required: true, unique: true },
  contacts: [ContactSubSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.EmergencyContact ||
  mongoose.model('EmergencyContact', EmergencyContactSchema);
