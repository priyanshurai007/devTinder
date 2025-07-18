const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema(
  {
    members: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ], // 2 members for now
  },
  { timestamps: true }
);

// optional: index for faster member queries
chatRoomSchema.index({ members: 1 });

module.exports = mongoose.model("ChatRoom", chatRoomSchema);
