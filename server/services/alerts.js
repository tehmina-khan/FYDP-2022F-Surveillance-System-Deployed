const { Resend } = require("resend");
const twilio = require("twilio");
const User = require("../models/User");

// ── Resend client ──────────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);

// ── Twilio client ──────────────────────────────────────────────────────────
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ── Send email via Resend ──────────────────────────────────────────────────
async function sendEmailAlert(incident, recipientEmail) {
  try {
    console.log(`\n[EMAIL] Preparing email for ${recipientEmail}`);

    const incidentUrl = `${process.env.FRONTEND_URL}/incident/${incident._id}`;

    const streamableVideo = incident.video_url
      ? incident.video_url.replace("/upload/", "/upload/f_mp4,vc_auto/")
      : null;

    // IMPORTANT:
    // Use onboarding@resend.dev for testing first
    // Custom emails require verified domain in Resend
    const response = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: recipientEmail,
      subject: "🚨 Violence Detected - CCTV Alert",

      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;
          background:#0f1318;color:#dde3ee;border-radius:12px;
          overflow:hidden;">

          <!-- Header -->
          <div style="background:#e63946;padding:24px;text-align:center;">
            <h1 style="margin:0;font-size:20px;color:#fff;
              letter-spacing:2px;">
              ⚠ VIOLENCE DETECTED
            </h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);
              font-size:13px;">
              CCTV — AI Surveillance Alert
            </p>
          </div>

          <!-- Body -->
          <div style="padding:28px;">

            <!-- Snapshot -->
            ${incident.image_url ? `
              <img src="${incident.image_url}"
                style="width:100%;border-radius:8px;
                  margin-bottom:20px;display:block;"
                alt="Incident snapshot"/>
            ` : ""}

            <!-- Details table -->
            <table style="width:100%;border-collapse:collapse;
              margin-bottom:24px;">

              ${[
                ["Camera", incident.camera_id],
                ["Time", new Date(incident.timestamp).toLocaleString()],
                ["Confidence", `${(incident.probability * 100).toFixed(1)}%`],
                ["Status", incident.status || "unreviewed"],
              ]
                .map(
                  ([label, value]) => `
                  <tr>
                    <td style="padding:10px 12px;background:#1a1f28;
                      color:#8a96aa;font-size:12px;
                      border-bottom:1px solid #2a2f3a;
                      width:120px;">
                      ${label}
                    </td>

                    <td style="padding:10px 12px;background:#1a1f28;
                      color:#dde3ee;font-size:13px;
                      border-bottom:1px solid #2a2f3a;">
                      ${value}
                    </td>
                  </tr>
                `
                )
                .join("")}
            </table>

            <!-- Buttons -->
            <div style="display:flex;gap:12px;flex-wrap:wrap;">

              <a href="${incidentUrl}"
                style="background:#e63946;color:#fff;
                  padding:12px 24px;border-radius:8px;
                  text-decoration:none;font-size:14px;
                  font-weight:600;display:inline-block;">
                View Incident
              </a>

              ${streamableVideo ? `
                <a href="${streamableVideo}"
                  style="background:#1a1f28;color:#dde3ee;
                    padding:12px 24px;border-radius:8px;
                    text-decoration:none;font-size:14px;
                    border:1px solid #2a2f3a;
                    display:inline-block;">
                  Watch Video
                </a>
              ` : ""}

            </div>

          </div>

          <!-- Footer -->
          <div style="padding:16px 28px;border-top:1px solid #2a2f3a;
            text-align:center;">

            <p style="margin:0;font-size:11px;color:#5a6478;">
              CCTV Sentinel — AI-Based Violence Detection System
            </p>

          </div>

        </div>
      `,
    });

    console.log("[EMAIL] Resend response:", response);

    if (response.error) {
      console.error("[EMAIL ERROR]", response.error);
    } else {
      console.log(`[EMAIL] Successfully sent to ${recipientEmail}`);
    }

  } catch (err) {
    console.error(`[EMAIL FAILED] ${recipientEmail}`);
    console.error(err);
  }
}

// ── Send SMS via Twilio ────────────────────────────────────────────────────
async function sendSMSAlert(incident) {
  try {
    console.log("[SMS] Sending SMS alerts...");

    const smsUsers = await User.find({
      receiveAlerts: true,
      phoneNumber: { $exists: true, $ne: "" }
    }).select("phoneNumber");

    console.log(`[SMS] Users found: ${smsUsers.length}`);

    if (smsUsers.length === 0) {
      console.log("[SMS] No users found for SMS alerts");
      return;
    }

    const smsResults = await Promise.allSettled(
      smsUsers.map((u) =>
        twilioClient.messages.create({
          from: process.env.TWILIO_PHONE_NUMBER,
          to: u.phoneNumber,
          body: `ALERT: Violence detected on ${incident.camera_id}. Check dashboard.`
        })
      )
    );

    smsResults.forEach((result, i) => {
      if (result.status === "rejected") {
        console.error(`[SMS FAILED] ${smsUsers[i].phoneNumber}`);
        console.error(result.reason?.message || result.reason);
      }
    });

    console.log("[SMS] Alerts processed successfully");

  } catch (err) {
    console.error("[SMS FAILED]");
    console.error(err.message);
  }
}

// ── Send alerts to all opted-in users ─────────────────────────────────────
async function sendAlerts(incident) {
  try {
    console.log("\n========== ALERT SYSTEM START ==========");

    // Check API key
    if (!process.env.RESEND_API_KEY) {
      console.error("[EMAIL] RESEND_API_KEY missing in .env");
      return;
    }

    console.log("[EMAIL] Fetching users with alerts enabled...");

    // Email — all users with receiveAlerts: true
    const alertUsers = await User.find({
      receiveAlerts: true,
    }).select("email");

    console.log("[EMAIL] Users list:", alertUsers);

    console.log(`[EMAIL] Users found: ${alertUsers.length}`);

    if (alertUsers.length === 0) {
      console.log("[EMAIL] No users have alerts enabled");
    } else {
      const emailResults = await Promise.allSettled(
        alertUsers.map((u) =>
          sendEmailAlert(incident, u.email)
        )
      );

      emailResults.forEach((result, i) => {
        if (result.status === "rejected") {
          console.error(
            `[EMAIL FAILED] ${alertUsers[i].email}`
          );

          console.error(result.reason);
        }
      });
    }

    // SMS
    await sendSMSAlert(incident);

    console.log("=========== ALERT SYSTEM END ===========\n");

  } catch (err) {
    console.error("[ALERTS SYSTEM ERROR]");
    console.error(err);
  }
}

module.exports = { sendAlerts };