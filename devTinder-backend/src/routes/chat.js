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
      return res.status(400).json({ message: "participantId required" });
    }

    // Only allow creating/getting a room for users who are connected (accepted)
    const { ConnectionRequestModel } = require("../Models/connectionRequest");
    const existing = await ConnectionRequestModel.findOne({
      $or: [
        { fromUserId: myId, toUserId: participantId, status: "accepted" },
        { fromUserId: participantId, toUserId: myId, status: "accepted" },
      ],
    });
    if (!existing) {
      return res.status(403).json({ message: "Not connected with this user" });
    }

    const room = await findOrCreateChatRoom(myId, participantId);
    await room.populate("members", "firstName lastName photoURL");
    res.status(200).json({ room });
  } catch (err) {
    console.error("chat/room error:", err);
    res.status(400).json({ message: err.message });
  }
});

/**
 * Get all chat rooms for logged in user (members includes me)
 */
chatRouter.get("/chat/rooms", userAuth, async (req, res) => {
  try {
    const myId = req.user._id;
    const page = parseInt(req.query.page || 1, 10);
    let limit = Math.min(parseInt(req.query.limit || 20, 10), 100);
    const skip = (page - 1) * limit;

    const rooms = await ChatRoom.find({ members: myId })
      .populate("members", "firstName lastName photoURL")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    // attach last message for each room
    const Message = require("../Models/message");
    const roomsWithLast = [];
    for (const r of rooms) {
      const last = await Message.find({ chatRoomId: r._id })
        .sort({ createdAt: -1 })
        .limit(1)
        .populate('senderId', 'firstName lastName photoURL');
      roomsWithLast.push({ room: r, lastMessage: last[0] || null });
    }

    const total = await ChatRoom.countDocuments({ members: myId });
    res.status(200).json({ rooms: roomsWithLast, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(400).json({ message: err.message });
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
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Ensure logged-in user is a member
    const myId = req.user._id.toString();
    const memberIds = room.members.map((m) => m.toString());
    if (!memberIds.includes(myId)) {
      return res.status(403).json({ message: "Not authorized for this room" });
    }

    const messages = await Message.find({ chatRoomId: roomId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("senderId", "firstName lastName photoURL");

    res.status(200).json({ messages: messages.reverse() }); // oldest-first for display
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = chatRouter;
