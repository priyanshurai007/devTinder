const mongoose = require("mongoose");

const referralRequestSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    company: { type: String, required: true },
    role: { type: String, required: true },
    message: { type: String },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

referralRequestSchema.index({ fromUserId: 1, toUserId: 1, company: 1, role: 1 });

module.exports = mongoose.model("ReferralRequest", referralRequestSchema);
