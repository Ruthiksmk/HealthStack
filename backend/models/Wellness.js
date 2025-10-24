// models/Wellness.js
import mongoose from "mongoose";

const WellnessSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  water: { type: Number, default: 0 },
  sleep: { type: Number, default: 0 },
  exercise: { type: String, default: "[]" }, // JSON string of activities
});

const Wellness = mongoose.model("Wellness", WellnessSchema);
export default Wellness;
