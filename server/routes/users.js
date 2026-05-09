const express   = require("express");
const router    = express.Router();
const User      = require("../models/User");
const protect   = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const multer    = require("multer");
const { uploadToCloudinary } = require("../services/cloudinary");
const path = require("path");
const os   = require("os");
const fs   = require("fs");

const upload = multer({ storage: multer.memoryStorage() });

// ── GET /api/users/profile ─────────────────────────────────────────────────
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/users/profile ─────────────────────────────────────────────────
router.put("/profile", protect, upload.single("profilePicture"),
  async (req, res) => {
    try {
      const { name, phoneNumber } = req.body;
      const updates = {};

      if (name)        updates.name        = name.trim();
      if (phoneNumber) updates.phoneNumber = phoneNumber.trim();

      // Upload new profile picture if provided
      if (req.file) {
        const tempPath = path.join(os.tmpdir(), req.file.originalname);
        fs.writeFileSync(tempPath, req.file.buffer);
        const url = await uploadToCloudinary(tempPath, "profiles", "image");
        if (url) updates.profilePicture = url;
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        updates,
        { new: true, runValidators: true }
      ).select("-password");

      res.status(200).json({ success: true, user });

    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ── PUT /api/users/change-password ─────────────────────────────────────────
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error:   "Current and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error:   "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error:   "Current password is incorrect",
      });
    }

    user.password = newPassword;  // pre-save hook hashes it
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/users/me ──────────────────────────────────────────────────────
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/users/alerts-preference ──────────────────────────────────────
router.put("/alerts-preference", protect, async (req, res) => {
  try {
    const { receiveAlerts } = req.body;
    if (typeof receiveAlerts !== "boolean") {
      return res.status(400).json({
        success: false,
        error:   "receiveAlerts must be true or false",
      });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { receiveAlerts },
      { new: true }
    ).select("-password");
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/users/pending ─────────────────────────────────────────────────
router.get("/pending", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ approvalStatus: "pending" })
      .select("-password").sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/users/:id/approve ─────────────────────────────────────────────
router.put("/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, approvalStatus: "approved" },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.status(200).json({ success: true, message: `${user.name} approved`, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/users/:id/reject ──────────────────────────────────────────────
router.put("/:id/reject", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: false, approvalStatus: "rejected" },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.status(200).json({ success: true, message: `${user.name} rejected`, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/users ─────────────────────────────────────────────────────────
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/users/:id ──────────────────────────────────────────────────
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: "Cannot delete your own account" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.status(200).json({ success: true, message: `${user.email} deleted` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/users/:id/role ────────────────────────────────────────────────
router.put("/:id/role", protect, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ success: false, error: "Role must be admin or user" });
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: "Cannot change your own role" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id, { role }, { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;