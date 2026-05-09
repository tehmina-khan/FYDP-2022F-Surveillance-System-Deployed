const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");

const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

// ── POST /api/auth/signup ──────────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error:   "Name, email and password are required",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        error:   "Email is already registered",
      });
    }

    // New users always start as pending — never auto-approved
    const user = await User.create({
      name,
      email,
      password,
      role:           "user",
      isApproved:     false,
      approvalStatus: "pending",
    });

    // Do NOT return a token — user must wait for admin approval
    res.status(201).json({
      success: true,
      message: "Account created. Waiting for admin approval before you can log in.",
    });

  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, error: messages[0] });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/auth/login ───────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error:   "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    // Always give same error for wrong email/password (security best practice)
    if (!user) {
      return res.status(401).json({
        success: false,
        error:   "Invalid email or password",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error:   "Invalid email or password",
      });
    }

    // ── Block unapproved users ─────────────────────────────────────────────
    if (user.approvalStatus === "rejected") {
      return res.status(403).json({
        success: false,
        error:   "Your account has been rejected. Contact admin for help.",
      });
    }

    if (!user.isApproved || user.approvalStatus === "pending") {
      return res.status(403).json({
        success: false,
        error:   "Account pending admin approval",
      });
    }

    // Only issue JWT if fully approved
    const token = signToken(user);

    res.status(200).json({
      success: true,
      token,
      user: {
        id:             user._id,
        name:           user.name,
        email:          user.email,
        role:           user.role,
        isApproved:     user.isApproved,
        approvalStatus: user.approvalStatus,
      },
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;