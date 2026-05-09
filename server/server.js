require("dotenv").config();
const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const protect  = require("./middleware/auth");
const path     = require("path");

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// ── Static files ───────────────────────────────────────────────────────────
app.use("/incidents", express.static(path.join(__dirname, "../incidents")));

// ── Public routes ──────────────────────────────────────────────────────────
app.use("/api/auth",  require("./routes/auth"));

// ── Protected routes ───────────────────────────────────────────────────────
app.use("/api/incidents", protect, require("./routes/incidents"));
app.use("/api/users",     protect, require("./routes/users"));    // ← new

// ── Health check ───────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "Violence Detection API is running" });
});

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ── Start ──────────────────────────────────────────────────────────────────
const PORT      = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });