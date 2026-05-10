console.log("🔥 INCIDENTS LOADED");
const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const path     = require("path");
const os       = require("os");
const fs       = require("fs");
const Incident = require("../models/Incident");
const protect  = require("../middleware/auth");
const { sendAlerts }         = require("../services/alerts");
const { uploadToCloudinary } = require("../services/cloudinary");

const upload = multer({ storage: multer.memoryStorage() });

// ── POST /api/incidents ───────────────────────────────────────────────────────
router.post("/", upload.fields([
  { name: "video", maxCount: 1 },
  { name: "image", maxCount: 1 },
]), async (req, res) => {
  try {
    const { camera_id, probability } = req.body;

    let video_url = null;
    let image_url = null;

    if (req.files?.video) {
      const file     = req.files.video[0];
      const tempPath = path.join(os.tmpdir(), file.originalname);
      fs.writeFileSync(tempPath, file.buffer);
      video_url = await uploadToCloudinary(tempPath, "videos");
    }

    if (req.files?.image) {
      const file     = req.files.image[0];
      const tempPath = path.join(os.tmpdir(), file.originalname);
      fs.writeFileSync(tempPath, file.buffer);
      image_url = await uploadToCloudinary(tempPath, "snapshots");
    }

    const incident = await Incident.create({
      camera_id,
      probability: parseFloat(probability),
      video_url,
      image_url,
    });

    sendAlerts(incident).catch(err =>
      console.error("[ALERT] Unexpected error:", err.message)
    );

    res.status(201).json({ success: true, data: incident });

  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ── GET /api/incidents ────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ timestamp: -1 });
    res.status(200).json({
      success: true,
      count:   incidents.length,
      data:    incidents,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PDFDocument = require("pdfkit");

// ── GET /api/incidents/report ──────────────────────────────────────────────
// Query params: ?from=2026-01-01&to=2026-12-31
router.get("/report", protect, async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error:   "from and to dates are required",
      });
    }

    const fromDate = new Date(from);
    const toDate   = new Date(to);
    toDate.setHours(23, 59, 59, 999);   // include full end day

    if (isNaN(fromDate) || isNaN(toDate)) {
      return res.status(400).json({
        success: false,
        error:   "Invalid date format. Use YYYY-MM-DD",
      });
    }

    if (fromDate > toDate) {
      return res.status(400).json({
        success: false,
        error:   "'from' date cannot be after 'to' date",
      });
    }

    const incidents = await Incident.find({
      timestamp: { $gte: fromDate, $lte: toDate },
    }).sort({ timestamp: -1 });

    // ── Build PDF ──────────────────────────────────────────────────────────
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type",        "application/pdf");
    res.setHeader("Content-Disposition",
      `attachment; filename="incident_report_${from}_to_${to}.pdf"`);

    doc.pipe(res);

    // ── Header ─────────────────────────────────────────────────────────────
    doc
      .fontSize(20)
      .fillColor("#e63946")
      .text("CCTV SENTINEL", { align: "center" })
      .fontSize(13)
      .fillColor("#555")
      .text("Incident Report", { align: "center" })
      .moveDown(0.5);

    // Date range banner
    doc
      .fontSize(10)
      .fillColor("#333")
      .text(
        `Period: ${fromDate.toDateString()}  →  ${toDate.toDateString()}`,
        { align: "center" }
      )
      .text(`Generated: ${new Date().toLocaleString()}`, { align: "center" })
      .moveDown(1);

    // Divider
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor("#e63946")
      .lineWidth(1)
      .stroke()
      .moveDown(0.75);

    // ── Summary stats ──────────────────────────────────────────────────────
    const violent    = incidents.filter(i => i.probability >= 0.6).length;
    const reviewed   = incidents.filter(i => i.status === "reviewed").length;
    const unreviewed = incidents.length - reviewed;

    doc.fontSize(12).fillColor("#111").text("Summary", { underline: true })
       .moveDown(0.4);

    const summaryLines = [
      ["Total Incidents",   incidents.length],
      ["Violence Alerts",   violent],
      ["Non-Violence",      incidents.length - violent],
      ["Reviewed",          reviewed],
      ["Unreviewed",        unreviewed],
    ];

    summaryLines.forEach(([label, value]) => {
      doc
        .fontSize(10)
        .fillColor("#444")
        .text(`${label}:`, { continued: true, width: 200 })
        .fillColor("#111")
        .text(` ${value}`);
    });

    doc.moveDown(1);

    // Divider
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor("#ccc")
      .lineWidth(0.5)
      .stroke()
      .moveDown(0.75);

    // ── Incidents table ────────────────────────────────────────────────────
    doc.fontSize(12).fillColor("#111")
       .text("Incident Log", { underline: true })
       .moveDown(0.5);

    if (incidents.length === 0) {
      doc.fontSize(10).fillColor("#888")
         .text("No incidents found in this date range.", { align: "center" });
    } else {

      // Table header
      const col = { id: 50, cam: 110, time: 200, conf: 340, status: 420 };

      doc.fontSize(9).fillColor("#fff");
      doc
        .rect(50, doc.y, 495, 18)
        .fill("#e63946");

      const headerY = doc.y - 18;
      doc
        .fillColor("#fff")
        .text("#",          col.id,     headerY + 5)
        .text("Camera",     col.cam,    headerY + 5)
        .text("Timestamp",  col.time,   headerY + 5)
        .text("Confidence", col.conf,   headerY + 5)
        .text("Status",     col.status, headerY + 5);

      doc.moveDown(0.2);

      // Table rows
      incidents.forEach((inc, i) => {
        // Page break check
        if (doc.y > 720) {
          doc.addPage();
          doc.moveDown(1);
        }

        const rowY = doc.y;
        const bg   = i % 2 === 0 ? "#f9f9f9" : "#ffffff";

        doc.rect(50, rowY, 495, 18).fill(bg);

        const isViolent = inc.probability >= 0.6;
        const confColor = isViolent ? "#e63946" : "#2ec4b6";

        doc
          .fontSize(8.5)
          .fillColor("#333")
          .text(String(i + 1),                                col.id,     rowY + 5)
          .text(inc.camera_id || "—",                         col.cam,    rowY + 5)
          .text(new Date(inc.timestamp).toLocaleString(),     col.time,   rowY + 5,
            { width: 130 })
          .fillColor(confColor)
          .text(`${(inc.probability * 100).toFixed(1)}%`,     col.conf,   rowY + 5)
          .fillColor(inc.status === "reviewed" ? "#2ec4b6" : "#f4a261")
          .text(inc.status || "unreviewed",                   col.status, rowY + 5);

        doc.moveDown(0.15);
      });
    }

    // ── Footer ─────────────────────────────────────────────────────────────
    doc.moveDown(2);
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor("#ccc")
      .lineWidth(0.5)
      .stroke()
      .moveDown(0.5);

    doc
      .fontSize(8)
      .fillColor("#aaa")
      .text("Generated by CCTV Sentinel — AI-Based Violence Detection System",
        { align: "center" });

    doc.end();

  } catch (err) {
    console.error("[REPORT]", err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// ── GET /api/incidents/:id ────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        error:   "Incident not found",
      });
    }
    res.status(200).json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/incidents/:id/status ─────────────────────────────────────────────
router.put("/:id/status", protect, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["unreviewed", "reviewed"].includes(status)) {
      return res.status(400).json({
        success: false,
        error:   "Status must be 'unreviewed' or 'reviewed'",
      });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        error:   "Incident not found",
      });
    }

    // ── Unmark review — only original reviewer can undo ────────────────────
    if (status === "unreviewed" && incident.status === "reviewed") {
      const isOriginalReviewer =
        incident.reviewedBy?.toString() === req.user._id.toString();

      if (!isOriginalReviewer) {
        return res.status(403).json({
          success: false,
          error:   "You are not authorized to modify this review",
        });
      }

      // Clear all reviewer fields
      incident.status         = "unreviewed";
      incident.reviewedBy     = null;
      incident.reviewedByName = null;
      incident.reviewedAt     = null;

      await incident.save();

      console.log(`[STATUS] Incident ${incident._id} unmarked by ${req.user.email}`);

      return res.status(200).json({ success: true, data: incident });
    }

    // ── Mark as reviewed — save reviewer info ──────────────────────────────
    if (status === "reviewed") {
      incident.status         = "reviewed";
      incident.reviewedBy     = req.user._id;
      incident.reviewedByName = req.user.name;
      incident.reviewedAt     = new Date();

      await incident.save();

      console.log(`[STATUS] Incident ${incident._id} reviewed by ${req.user.email}`);

      return res.status(200).json({ success: true, data: incident });
    }

    res.status(200).json({ success: true, data: incident });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;