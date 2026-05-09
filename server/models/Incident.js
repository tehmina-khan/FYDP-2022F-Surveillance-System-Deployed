const mongoose = require("mongoose");

const IncidentSchema = new mongoose.Schema(
  {
    camera_id: {
      type:     String,
      required: [true, "camera_id is required"],
      trim:     true,
    },
    timestamp: {
      type:    Date,
      default: Date.now,
    },
    probability: {
      type:     Number,
      required: [true, "probability is required"],
      min:      0,
      max:      1,
    },
    video_url: {
      type:    String,
      default: null,
    },
    image_url: {
      type:    String,
      default: null,
    },
    status: {
      type:    String,
      enum:    ["unreviewed", "reviewed"],
      default: "unreviewed",
    },
    reviewedBy: {                        // ← new
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "User",
      default: null,
    },
    reviewedByName: {                    // ← new
      type:    String,
      default: null,
    },
    reviewedAt: {                        // ← new
      type:    Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Incident", IncidentSchema);