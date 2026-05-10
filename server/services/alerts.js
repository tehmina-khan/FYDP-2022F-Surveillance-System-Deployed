console.log("alerts.js loaded");

const nodemailer = require("nodemailer");
const twilio     = require("twilio");
const User       = require("../models/User");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  family: 4,     // FORCE IPv4
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ── Send email ─────────────────────────────────────────────────────────────
async function sendEmailAlert(incident, recipientEmail) {
  const incidentUrl    = `${process.env.FRONTEND_URL}/incident/${incident._id}`;
  const streamableVideo = incident.video_url
    ? incident.video_url.replace("/upload/", "/upload/f_mp4,vc_auto/")
    : null;

  await transporter.sendMail({
    from:    `"CCTV Alert System" <${process.env.EMAIL_USER}>`,
    to:      recipientEmail,
    subject: "🚨 Violence Detected - CCTV Alert",
    html: `
      <h2 style="color:red;">⚠️ Violence Detected</h2>
      <table style="font-size:15px; border-collapse:collapse;">
        <tr><td><b>Camera</b></td><td>${incident.camera_id}</td></tr>
        <tr><td><b>Time</b></td><td>${new Date(incident.timestamp).toLocaleString()}</td></tr>
        <tr><td><b>Probability</b></td><td>${(incident.probability * 100).toFixed(1)}%</td></tr>
      </table>

      ${incident.image_url ? `
        <br/>
        <img src="${incident.image_url}" width="400"
             style="border-radius:8px; margin:10px 0;"
             alt="Incident snapshot"/>
      ` : ""}

      <br/>
      <a href="${incidentUrl}" style="background:red;color:white;
        padding:10px 20px;text-decoration:none;border-radius:5px;
        font-size:15px;display:inline-block;margin-right:10px;">
        View Incident
      </a>

      ${streamableVideo ? `
        <a href="${streamableVideo}" style="background:#333;color:white;
          padding:10px 20px;text-decoration:none;border-radius:5px;
          font-size:15px;display:inline-block;">
          Watch Video
        </a>
      ` : ""}
    `,
  });

  console.log(`  [EMAIL] Alert sent to ${recipientEmail}`);
}

// ── Send SMS ───────────────────────────────────────────────────────────────
async function sendSMSAlert(incident) {
  const incidentUrl = `${process.env.FRONTEND_URL}/incident/${incident._id}`;

  await twilioClient.messages.create({
    from: process.env.TWILIO_FROM,
    to:   process.env.TWILIO_TO,
    body: `🚨 CCTV ALERT: Violence detected on ${incident.camera_id} at ${new Date(incident.timestamp).toLocaleString()}. Confidence: ${(incident.probability * 100).toFixed(1)}%. View: ${incidentUrl}`,
  });

  console.log(`  [SMS] Alert sent to ${process.env.TWILIO_TO}`);
}

// ── Send alerts to all opted-in users ─────────────────────────────────────
async function sendAlerts(incident) {
  try {
    // Fetch all users who have alerts enabled
    const alertUsers = await User.find({ receiveAlerts: true }).select("email");

    if (alertUsers.length === 0) {
      console.log("  [ALERTS] No users have alerts enabled — skipping email");
    } else {
      // Send email to every opted-in user
      const emailPromises = alertUsers.map(u => sendEmailAlert(incident, u.email));
      const emailResults  = await Promise.allSettled(emailPromises);

      emailResults.forEach((result, i) => {
        if (result.status === "rejected") {
          console.error(`  [EMAIL] Failed for ${alertUsers[i].email}:`, result.reason.message);
        }
      });
    }

    // SMS always goes to the number in .env (Twilio free tier limitation)
    try {
    await sendSMSAlert(incident);
  } catch(err) {
    console.error("[SMS] Failed:", err.message);
  }

  } catch (err) {
    console.error("[ALERTS] Unexpected error:", err.message);
  }
}

module.exports = { sendAlerts };