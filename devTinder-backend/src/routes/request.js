const express = require("express");
const requestRouter = express.Router();
const { userAuth } = require("../Middlewares/auth");
const { ConnectionRequestModel } = require("../Models/connectionRequest");
const User = require("../Models/user");
const { findOrCreateChatRoom } = require("../services/chatService");
const ChatRoom = require("../Models/chatRoom"); // if you need it elsewhere

requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const user = req.user;
      const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;

      // Prevent sending a connection request to self
      if (fromUserId.toString() === toUserId.toString()) {
        return res.status(400).json({ message: "Cannot send connection request to yourself", success: false });
      }

      //toUser exist check
      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(404).json({
          message: "User not found",
          success: false,
        });
      }

      //Status Check - accept legacy 'intrested' and new 'pending'
      const allowedStatuses = ["ignored", "intrested", "pending"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid status type: " + status,
          success: false,
        });
      }

      // Normalize legacy 'intrested' to 'pending' for consistency
      const normalizedStatus = status === "intrested" ? "pending" : status;

      //Existing user exist check
      const existingConnectionRequest = await ConnectionRequestModel.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });
      if (existingConnectionRequest) {
        return res.status(409).json({
          message: "Already sent the connection request before",
          success: false,
        });
      }

      const connectionRequest = new ConnectionRequestModel({
        fromUserId,
        toUserId,
        status: normalizedStatus,
      });

      const data = await connectionRequest.save();
      res.status(201).json({
        message: user.firstName + " is " + status + " in " + toUser.firstName,
        data,
        success: true,
      });
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  }
);

requestRouter.post(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUser = req.user;
      const { status, requestId } = req.params;

      //Validate Status for review - accept accepted or declined (and legacy rejected)
      const allowedReviewStatuses = ["accepted", "declined", "rejected"];
      if (!allowedReviewStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid Status or Status not allowed",
          success: false,
        });
      }

      //validating the request
      // Only allow reviewing pending/intrested requests
      const connectionRequest = await ConnectionRequestModel.findOne({
        _id: requestId,
        toUserId: loggedInUser._id,
        status: { $in: ["pending", "intrested"] },
      });

      if (!connectionRequest) {
        return res.status(404).json({
          message: "Request not found",
          success: false,
        });
      }

      // Normalize legacy 'rejected' -> 'declined'
      // If declined, remove the request record so it disappears for both users
      if (status === 'declined' || status === 'rejected') {
        await ConnectionRequestModel.deleteOne({ _id: connectionRequest._id });
        return res.status(200).json({ message: 'Connection request declined', success: true });
      }

      // Otherwise mark accepted
      connectionRequest.status = status === 'rejected' ? 'declined' : status;
      const data = await connectionRequest.save();

      // If accepted, create/find chat room
      if (status === "accepted") {
        const room = await findOrCreateChatRoom(
          connectionRequest.fromUserId,
          connectionRequest.toUserId
        );
      }

      res.status(200).json({
        message: "Connection request " + status,
        data,
        success: true,
      });
    } catch (error) {
      res.status(400).json({ message: error.message, success: false });
    }
  }
);

// Allow sender to cancel a pending request
requestRouter.post('/request/cancel/:requestId', userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { requestId } = req.params;
    const reqDoc = await ConnectionRequestModel.findById(requestId);
    if (!reqDoc) return res.status(404).json({ message: 'Request not found' });
    if (reqDoc.fromUserId.toString() !== loggedInUser._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this request' });
    }
    await ConnectionRequestModel.deleteOne({ _id: requestId });
    return res.status(200).json({ message: 'Request cancelled', success: true });
  } catch (err) {
    console.error('/request/cancel error', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = requestRouter;

// New helper endpoint: get relationship/request status between authenticated user and another user
// GET /request/status/:otherUserId
requestRouter.get(
  "/request/status/:otherUserId",
  userAuth,
  async (req, res) => {
    try {
      const me = req.user;
      const otherId = req.params.otherUserId;

      if (!otherId) return res.status(400).json({ message: "otherUserId required" });

      const reqDoc = await ConnectionRequestModel.findOne({
        $or: [
          { fromUserId: me._id, toUserId: otherId },
          { fromUserId: otherId, toUserId: me._id },
        ],
      }).populate("fromUserId toUserId", "firstName lastName photoURL");

      if (!reqDoc) return res.status(200).json({ data: null });

      return res.status(200).json({ data: reqDoc });
    } catch (err) {
      console.error("/request/status error", err.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);
