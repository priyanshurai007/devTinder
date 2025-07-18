const express = require("express");
const { userAuth } = require("../Middlewares/auth");
const ChatRoom = require("../Models/chatRoom");
const Message = require("../Models/message");
const { findOrCreateChatRoom } = require("../services/chatService");

const chatRouter = express.Router();

/**
 * Create or get a chat room between logged-in user and participantId
 */
chatRouter.post("/chat/room", userAuth, async (req, res) => {
  try {
    const myId = req.user._id;
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ error: "participantId required" });
    }

    const room = await findOrCreateChatRoom(myId, participantId);

    // (Optional) populate for UI convenience
    await room.populate("members", "firstName lastName photoURL");

    res.json({ room });
  } catch (err) {
    console.error("chat/room error:", err);
    res.status(400).send("ERROR: " + err.message);
  }
});

/**
 * Get all chat rooms for logged in user (members includes me)
 */
chatRouter.get("/chat/rooms", userAuth, async (req, res) => {
  try {
    const myId = req.user._id;
    const rooms = await ChatRoom.find({ members: myId })
      .populate("members", "firstName lastName photoURL");
    res.json({ rooms });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

/**
 * Get message history for a room (paginated)
 * /chat/messages/:roomId?page=1&limit=50
 */
chatRouter.get("/chat/messages/:roomId", userAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page || 1, 10);
    const limit = Math.min(parseInt(req.query.limit || 50, 10), 100);
    const skip = (page - 1) * limit;

    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).send("Room not found");

    // Ensure logged-in user is a member
    const myId = req.user._id.toString();
    const memberIds = room.members.map((m) => m.toString());
    if (!memberIds.includes(myId)) {
      return res.status(403).send("Not authorized for this room");
    }

    const messages = await Message.find({ chatRoomId: roomId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("senderId", "firstName lastName photoURL");

    res.json({ messages: messages.reverse() }); // oldest-first for display
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

module.exports = chatRouter;
