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
      return res.status(400).send("All fields required");
    }

    // Check for duplicates
    const exists = await ReferralRequest.findOne({ fromUserId, toUserId, company, role });
    if (exists) {
      return res.status(409).json({ message: "Referral already requested" });
    }

    const referral = await ReferralRequest.create({
      fromUserId,
      toUserId,
      company,
      role,
      message,
    });

    res.json({ message: "Referral sent", referral });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// View referrals sent/received
referralRouter.get("/referral/my-requests", userAuth, async (req, res) => {
  try {
    const myId = req.user._id;
    const sent = await ReferralRequest.find({ fromUserId: myId }).populate("toUserId", "firstName lastName photoURL");
    const received = await ReferralRequest.find({ toUserId: myId }).populate("fromUserId", "firstName lastName photoURL");
    res.json({ sent, received });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// Review request (accept/reject)
referralRouter.post("/referral/review/:requestId/:action", userAuth, async (req, res) => {
  try {
    const { requestId, action } = req.params;
    const allowed = ["accepted", "rejected"];
    if (!allowed.includes(action)) return res.status(400).send("Invalid action");

    const referral = await ReferralRequest.findById(requestId);
    if (!referral || referral.toUserId.toString() !== req.user._id.toString()) {
      return res.status(403).send("Not authorized");
    }

    referral.status = action;
    await referral.save();
    res.json({ message: `Referral ${action}`, referral });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

referralRouter.post("/referral/generate-message", userAuth, async (req, res) => {
  const { company, role } = req.body;
  const { firstName, skills, about } = req.user;

  if (!company || !role || !about || !skills) {
    return res.status(400).send("Missing info for message generation");
  }

  try {
    const message = generateReferralMessage({ firstName, skills, about, company, role });
    res.json({ message });
  } catch (err) {
    res.status(500).send("Message generation failed");
  }
});

module.exports = referralRouter;
