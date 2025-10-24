// -------------------------------
// ✅ Required Modules
// -------------------------------
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');
const mongoose = require('mongoose'); // ✅ added mongoose
const notificationsRoutes = require("./routes/notifications");
const sosRoutes = require("./routes/sos");
const emergencyRoutes = require('./routes/emergency');
const nodemailer = require('nodemailer'); // ✅ Added for email sending

const app = express();
const PORT = 3001;

// -------------------------------
// 🔐 MongoDB Configuration (MongoClient for your main DB)
// -------------------------------
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("HealthStackApp");
    console.log('✅ Successfully connected to MongoDB Atlas (MongoClient)!');
  } catch (e) {
    console.error("❌ Could not connect to MongoDB Atlas", e);
    process.exit(1);
  }
}

// -------------------------------
// ✅ Separate Mongoose Connection (for models like EmergencyContact.js)
// -------------------------------
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Mongoose connected successfully!"))
.catch(err => console.error("❌ Mongoose connection error:", err));

// -------------------------------
// ⚙️ Middleware
// -------------------------------
app.use(cors());
app.use(express.json());

// -------------------------------
// 📧 Email Setup (Nodemailer with Gmail)
// -------------------------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // e.g. your Gmail address
    pass: process.env.EMAIL_PASS  // Gmail App Password
  }
});

// ✅ Test the transporter (optional)
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter failed:", error);
  } else {
    console.log("✅ Email transporter ready to send messages!");
  }
});

// Example email API endpoint
app.post("/api/send-email", async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: message,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📨 Email sent to ${to}`);
    res.json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// -------------------------------
// 🌿 Wellness Routes
// -------------------------------
app.get('/api/wellness', async (req, res) => {
  try {
    const wellnessCollection = db.collection('wellness');
    const data = await wellnessCollection.find({}).sort({ date: -1 }).toArray();
    res.json({ message: 'success', data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/wellness', async (req, res) => {
  try {
    const { date, ...data } = req.body;
    const wellnessCollection = db.collection('wellness');
    const result = await wellnessCollection.updateOne(
      { date: date },
      { $set: data },
      { upsert: true }
    );
    res.json({ message: 'Entry saved successfully', result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/activities', async (req, res) => {
  try {
    const { name, duration, date } = req.body;
    if (!name || !duration) {
      return res.status(400).json({ error: 'Name and duration required' });
    }
    await db.collection('wellness').insertOne({
      date,
      type: 'activity',
      name,
      duration,
      createdAt: new Date(),
    });
    res.json({ message: 'Activity logged successfully' });
  } catch (error) {
    console.error('Error adding activity:', error);
    res.status(500).json({ error: 'Failed to add activity' });
  }
});

// -------------------------------
// 📅 Appointment Routes
// -------------------------------
app.post('/api/appointments', async (req, res) => {
  try {
    const appointmentData = { ...req.body, status: 'Pending' };
    const appointmentsCollection = db.collection('appointments');
    const result = await appointmentsCollection.insertOne(appointmentData);

    const notificationsCollection = db.collection("notifications");
    await notificationsCollection.insertOne({
      userEmail: appointmentData.doctorEmail,
      title: "New Appointment Booked",
      message: `You have a new appointment with ${appointmentData.patientName}.`,
      date: new Date(),
      read: false
    });

    console.log(`✅ Appointment saved with ID: ${result.insertedId}`);
    res.json({ message: 'Appointment booked successfully!', appointmentId: result.insertedId });
  } catch (e) {
    console.error("Error saving appointment:", e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/appointments', async (req, res) => {
  try {
    const { patientEmail } = req.query;
    const appointmentsCollection = db.collection('appointments');
    const filter = patientEmail ? { patientEmail } : {};
    const data = await appointmentsCollection.find(filter).sort({ date: -1, time: -1 }).toArray();
    console.log(`✅ Fetched ${data.length} appointments.`);
    res.json({ message: 'success', data });
  } catch (e) {
    console.error("❌ Error fetching appointments:", e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'New status is required.' });

    const appointmentsCollection = db.collection('appointments');
    const result = await appointmentsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );
    const appointment = await appointmentsCollection.findOne({ _id: new ObjectId(id) });
    const notificationsCollection = db.collection("notifications");
    await notificationsCollection.insertOne({
      userEmail: appointment.patientEmail,
      title: "Appointment Status Updated",
      message: `Your appointment with Dr. ${appointment.doctorName} has been ${status}.`,
      date: new Date(),
      read: false
    });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    console.log(`✅ Updated status of appointment ${id} to "${status}"`);
    res.json({ message: 'Status updated successfully' });
  } catch (e) {
    console.error("❌ Error updating appointment status:", e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const appointmentsCollection = db.collection('appointments');
    const result = await appointmentsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    console.log(`✅ Deleted appointment ${id}`);
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (e) {
    console.error("❌ Error deleting appointment:", e);
    res.status(500).json({ error: e.message });
  }
});

// -------------------------------
// 👤 Authentication (Register + Login)
// -------------------------------
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ error: 'All fields are required.' });

    const usersCollection = db.collection('users');
    const existing = await usersCollection.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { name, email, password: hashedPassword, role, createdAt: new Date() };
    await usersCollection.insertOne(newUser);

    console.log(`✅ Registered new ${role}: ${email}`);
    res.json({ message: 'Registration successful! You can now login.' });
  } catch (e) {
    console.error('❌ Error in /api/register:', e);
    res.status(500).json({ error: e.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const usersCollection = db.collection('users');

    let user;
    if (role) user = await usersCollection.findOne({ email, role });
    else user = await usersCollection.findOne({ email });

    if (!user) return res.status(404).json({ error: 'User not found.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ ${user.role} logged in: ${email}`);

    res.json({
      message: 'Login successful',
      token,
      role: user.role,
      name: user.name,
      email: user.email
    });
  } catch (e) {
    console.error('❌ Error in /api/login:', e);
    res.status(500).json({ error: e.message });
  }
});

// -------------------------------
// 🧩 Utility Routes
// -------------------------------
app.delete("/api/clear", async (req, res) => {
  try {
    await db.collection("wellness").deleteMany({});
    res.json({ message: "All wellness data cleared." });
  } catch (err) {
    console.error("Error clearing data:", err);
    res.status(500).json({ error: "Failed to clear data" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server running fine ✅" });
});

// -------------------------------
// 📣 Custom Routes
// -------------------------------
app.use("/api/notifications", notificationsRoutes);
app.use("/api/sos", sosRoutes);
app.use('/api/emergency', emergencyRoutes);

// -------------------------------
// ❗ Global Error Handler
// -------------------------------
app.use((err, req, res, next) => {
  console.error("💥 Uncaught Server Error:", err);
  res.status(500).json({ error: "Internal server error", details: err.message });
});

// server.js or routes/emergency.js
app.post('/api/emergency', async (req, res) => {
  const { patientEmail, email } = req.body;
  if (!patientEmail || !email) {
    return res.status(400).json({ message: "Both emails required." });
  }

  // Then it probably saves to MongoDB / JSON / local file
});

// -------------------------------
// 🚀 Start Server
// -------------------------------
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
  });
});
