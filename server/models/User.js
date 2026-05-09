const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, "Name is required"],
      trim:     true,
    },
    email: {
      type:      String,
      required:  [true, "Email is required"],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/\S+@\S+\.\S+/, "Enter a valid email"],
    },
    password: {
      type:      String,
      required:  [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type:    String,
      enum:    ["admin", "user"],
      default: "user",
    },
    receiveAlerts: {
      type:    Boolean,
      default: true,
    },
    isApproved: {
      type:    Boolean,
      default: false,
    },
    approvalStatus: {
      type:    String,
      enum:    ["pending", "approved", "rejected"],
      default: "pending",
    },
    profilePicture: {                    // ← new
      type:    String,
      default: null,
    },
    phoneNumber: {                       // ← new
      type:    String,
      default: null,
      trim:    true,
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);