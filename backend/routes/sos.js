const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
require("dotenv").config();

// ✅ Check if email credentials loaded
console.log(
  "Email credentials:",
  process.env.EMAIL_USER,
  process.env.EMAIL_PASS ? "Loaded" : "Missing"
);

// ✅ Setup email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // ⚠️ Must be Gmail App Password, not normal password
  },
});

// ✅ Test Route
router.get("/", (req, res) => {
  res.json({ message: "🚨 SOS API working properly" });
});

// ✅ SOS Alert Route
router.post("/send", async (req, res) => {
  try {
    const { name, location, emergencyContacts } = req.body;

    console.log("📩 [SOS] Request received with body:", req.body);

    // ✅ Validate inputs
    if (!name || !location) {
      return res.status(400).json({ error: "Missing name or location." });
    }

    if (!emergencyContacts || !Array.isArray(emergencyContacts) || emergencyContacts.length === 0) {
      return res.status(400).json({ error: "No emergency contacts provided." });
    }

    // ✅ Construct Google Maps link
    const mapLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`;

    // ✅ Prepare email details
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emergencyContacts.join(","), // ✅ Send to all contacts
      subject: "🚨 SOS Alert - Your Friend Needs Help!",
      html: `
        <h2>🚨 Emergency Alert</h2>
        <p><strong>${name}</strong> has triggered an SOS alert and may need immediate assistance.</p>
        <p>📍 Location: <a href="${mapLink}" target="_blank">View on Google Maps</a></p>
        <p>Please reach out or check their safety as soon as possible.</p>
        <hr/>
        <p>⚠️ This message was automatically sent by the HealthStack system.</p>
      `,
    };

    console.log("📨 Sending SOS email to:", emergencyContacts);

    // ✅ Send email
    await transporter.sendMail(mailOptions);

    console.log("✅ SOS Email sent successfully!");
    res.json({ message: "✅ SOS email sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending SOS email:", error);
    res.status(500).json({ error: "Failed to send SOS email." });
  }
});

module.exports = router;
