const express = require("express");
const referralRouter = express.Router();
const { userAuth } = require("../Middlewares/auth");
const ReferralRequest = require("../Models/referralRequest");
const User = require("../Models/user");
const { generateReferralMessage } = require("../utils/messageGenerator"); 

// Send Referral Request
referralRouter.post("/referral/send", userAuth, async (req, res) => {
  try {
    const { toUserId, company, role, message } = req.body;
    const fromUserId = req.user._id;

    if (!toUserId || !company || !role) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Prevent sending a referral to oneself
    if (fromUserId.toString() === toUserId.toString()) {
      return res.status(400).json({ message: "Cannot send a referral to yourself" });
    }
    // Check for duplicates
    const exists = await ReferralRequest.findOne({ fromUserId, toUserId, company, role });
    if (exists) {
      return res.status(409).json({ message: "Referral already requested" });
    }

    let referral = await ReferralRequest.create({
      fromUserId,
      toUserId,
      company,
      role,
      message,
    });

    // populate for client
    referral = await ReferralRequest.findById(referral._id).populate('fromUserId', 'firstName lastName photoURL').populate('toUserId', 'firstName lastName photoURL');

    // notify receiver in real-time if socket available
    try {
      if (global.io) {
        global.io.to(`user_${toUserId}`).emit('referralCreated', { referral });
      }
    } catch (e) {
      // ignore emit errors
    }

  res.status(201).json({ message: "Referral sent", referral });
  } catch (err) {
  res.status(400).json({ message: err.message });
  }
});

// View referrals sent/received
referralRouter.get("/referral/my-requests", userAuth, async (req, res) => {
  try {
    const myId = req.user._id;
    const sent = await ReferralRequest.find({ fromUserId: myId }).populate("toUserId", "firstName lastName photoURL");
    const received = await ReferralRequest.find({ toUserId: myId }).populate("fromUserId", "firstName lastName photoURL");
    res.status(200).json({ sent, received });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Review request (accept/reject)
referralRouter.post("/referral/review/:requestId/:action", userAuth, async (req, res) => {
  try {
    const { requestId, action } = req.params;
    const allowed = ["accepted", "rejected"];
  if (!allowed.includes(action)) return res.status(400).json({ message: "Invalid action" });

    const referral = await ReferralRequest.findById(requestId);
    // Debug: log who is trying to review and who the referral is addressed to
    // (debug logs removed)

    if (!referral) {
      return res.status(404).json({ message: "Referral not found" });
    }

    // Normalize IDs; referral.toUserId may be an ObjectId or populated doc
    const referralToId = referral.toUserId && referral.toUserId._id ? referral.toUserId._id.toString() : (referral.toUserId ? referral.toUserId.toString() : null);
    const authId = req.user && req.user._id ? req.user._id.toString() : null;

    if (!authId || referralToId !== authId) {
      return res.status(403).json({ message: "Not authorized - only the referral recipient can accept/reject" });
    }

    referral.status = action;
    await referral.save();

    // populate for response
    const populated = await ReferralRequest.findById(referral._id).populate('fromUserId', 'firstName lastName photoURL').populate('toUserId', 'firstName lastName photoURL');

    // notify both parties
    try {
      if (global.io) {
        global.io.to(`user_${referral.fromUserId.toString()}`).emit('referralUpdated', { referral: populated });
        global.io.to(`user_${referral.toUserId.toString()}`).emit('referralUpdated', { referral: populated });
      }
    } catch (e) {}

    res.status(200).json({ message: `Referral ${action}`, referral: populated });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

referralRouter.post("/referral/generate-message", userAuth, async (req, res) => {
  const { company, role } = req.body;
  const { firstName, skills, about } = req.user;

  if (!company || !role || !about || !skills) {
    return res.status(400).json({ message: "Missing info for message generation" });
  }

  try {
    const message = generateReferralMessage({ firstName, skills, about, company, role });
    res.status(200).json({ message });
  } catch (err) {
    res.status(500).json({ message: "Message generation failed" });
  }
});

module.exports = referralRouter;
