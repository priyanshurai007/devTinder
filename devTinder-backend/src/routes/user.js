const express = require("express");
const userRouter = express.Router();
const { userAuth } = require("../Middlewares/auth");
const { ConnectionRequestModel } = require("../Models/connectionRequest");
const User = require("../Models/user");
const mongoose = require('mongoose');

const getEmbedding = require("../utils/getEmbedding");
const cosineSimilarity = require("../utils/cosineSimilarity");


const USER_SAFE_DATA = "firstName lastName photoURL about age gender skills emailId";

userRouter.get("/user/requests/recieved", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const page = parseInt(req.query.page || 1, 10);
    let limit = parseInt(req.query.limit || 10, 10);
    limit = Math.min(limit, 50);
    const skip = (page - 1) * limit;

      // Accept both legacy 'intrested' and new 'pending' statuses
      const filter = { toUserId: loggedInUser._id, status: { $in: ["intrested", "pending"] } };
    const total = await ConnectionRequestModel.countDocuments(filter);
    const connectionRequests = await ConnectionRequestModel.find(filter)
      .populate("fromUserId", USER_SAFE_DATA)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      connectionRequests,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(400).send("ERROR:" + error.message);
  }
});

// Sent requests for the logged in user
userRouter.get("/user/requests/sent", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const page = parseInt(req.query.page || 1, 10);
    let limit = parseInt(req.query.limit || 10, 10);
    limit = Math.min(limit, 50);
    const skip = (page - 1) * limit;

    const filter = { fromUserId: loggedInUser._id };
    const total = await ConnectionRequestModel.countDocuments(filter);
    const sentRequests = await ConnectionRequestModel.find(filter)
      .populate("toUserId", USER_SAFE_DATA)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      sentRequests,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(400).send("ERROR:" + error.message);
  }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    // Basic pagination params
    const page = parseInt(req.query.page || 1, 10);
    let limit = parseInt(req.query.limit || 10, 10);
    limit = Math.min(limit, 100);
    const skip = (page - 1) * limit;

    const connectionRequests = await ConnectionRequestModel.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    }).populate("fromUserId toUserId", USER_SAFE_DATA);

    const data = connectionRequests.map((row) => {
      if (row.fromUserId._id.toString() == loggedInUser._id.toString()) {
        return row.toUserId;
      }
      return row.fromUserId;
    });

    // Deduplicate connections by user id in case multiple accepted records exist
    const uniqueMap = new Map();
    data.forEach((u) => {
      try {
        const id = u && (u._id ? u._id.toString() : u.toString());
        if (id && !uniqueMap.has(id)) uniqueMap.set(id, u);
      } catch (e) {
        // ignore malformed entries
      }
    });

    const uniqueArray = Array.from(uniqueMap.values());
    const total = uniqueArray.length;
    const paged = uniqueArray.slice(skip, skip + limit);

    res.status(200).json({
      data: paged,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(400).send("ERROR :" + error.message);
  }
});

userRouter.get("/user/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const page = parseInt(req.query.page || 1);
    let limit = parseInt(req.query.limit || 10);
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    // Exclude self and already accepted connections
    const connectionRequest = await ConnectionRequestModel.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
      status: "accepted",
    }).select("fromUserId toUserId status");

    const hideUsersFromFeed = new Set();
    connectionRequest.forEach((row) => {
      const fromId = row.fromUserId && row.fromUserId.toString();
      const toId = row.toUserId && row.toUserId.toString();
      // add the other user's id (not the logged in user)
      if (fromId && fromId !== loggedInUser._id.toString()) hideUsersFromFeed.add(fromId);
      if (toId && toId !== loggedInUser._id.toString()) hideUsersFromFeed.add(toId);
    });
      // Build an array of ObjectId values for reliable comparison in Mongo queries
      const excludedIds = Array.from(hideUsersFromFeed).map((id) => {
        try {
          if (!id) return null;
          if (id instanceof mongoose.Types.ObjectId) return id;
          if (typeof id === 'object' && id._id) {
            return id._id instanceof mongoose.Types.ObjectId ? id._id : new mongoose.Types.ObjectId(id._id);
          }
          if (typeof id === 'string') return new mongoose.Types.ObjectId(id);
          return null;
        } catch (e) {
          return null;
        }
      }).filter(Boolean);
      // also exclude the logged-in user explicitly
      try {
        excludedIds.push(loggedInUser._id instanceof mongoose.Types.ObjectId ? loggedInUser._id : new mongoose.Types.ObjectId(loggedInUser._id));
      } catch (e) {
        // ignore if can't convert
      }

      const users = await User.find({
        _id: { $nin: excludedIds },
      })
      .select(USER_SAFE_DATA)
      .skip(skip)
      .limit(limit);

    res.send(users);
  } catch (error) {
    res.status(400).send("ERROR: " + error.message);
  }
});


userRouter.get("/user/smart-feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    // Use stored embedding if available, otherwise compute and store it (best-effort)
    let myVector = Array.isArray(loggedInUser.embedding) ? loggedInUser.embedding : null;
    if (!myVector) {
      const skills = Array.isArray(loggedInUser.skills) ? loggedInUser.skills.join(" ") : "";
        // Build a unique list of the other participant (the connected user)
        const otherIdsSet = new Set();
        for (const row of connectionRequests) {
          try {
            const fromId = row.fromUserId && row.fromUserId._id ? row.fromUserId._id.toString() : (row.fromUserId && row.fromUserId.toString && row.fromUserId.toString());
            const toId = row.toUserId && row.toUserId._id ? row.toUserId._id.toString() : (row.toUserId && row.toUserId.toString && row.toUserId.toString());
            if (fromId && fromId !== loggedInUser._id.toString()) otherIdsSet.add(fromId);
            if (toId && toId !== loggedInUser._id.toString()) otherIdsSet.add(toId);
          } catch (e) {
            // ignore conversion issues per-row
          }
        }

        const otherIds = Array.from(otherIdsSet).map((id) => {
          try {
            return mongoose.Types.ObjectId(id);
          } catch (e) {
            return null;
          }
        }).filter(Boolean);

        // Query the User collection for those unique ids and paginate results
        const total = otherIds.length;
        const pagedIds = otherIds.slice(skip, skip + limit);
        const paged = await User.find({ _id: { $in: pagedIds } }).select(USER_SAFE_DATA);
    const requests = await ConnectionRequestModel.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
      status: "accepted",
    });

    const excludedIds = new Set([loggedInUser._id.toString()]);
    requests.forEach((r) => {
      const fromId = r.fromUserId && r.fromUserId.toString();
      const toId = r.toUserId && r.toUserId.toString();
      if (fromId && fromId !== loggedInUser._id.toString()) excludedIds.add(fromId);
      if (toId && toId !== loggedInUser._id.toString()) excludedIds.add(toId);
    });

    // convert to ObjectId array for reliable $nin comparisons (handle strings/ObjectIds)
    const excludedArray = Array.from(excludedIds).map((id) => {
      try {
        if (!id) return null;
        if (id instanceof mongoose.Types.ObjectId) return id;
        if (typeof id === 'object' && id._id) {
          return id._id instanceof mongoose.Types.ObjectId ? id._id : new mongoose.Types.ObjectId(id._id);
        }
        if (typeof id === 'string') return new mongoose.Types.ObjectId(id);
        return null;
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    // Fast path: compute similarity only for users who already have embeddings stored
    const otherUsersWithEmbeddings = await User.find({
      _id: { $nin: excludedArray },
      embedding: { $exists: true, $ne: [] },
    }).select("firstName lastName about skills photoURL embedding");

    const results = [];
    for (const user of otherUsersWithEmbeddings) {
      try {
        const otherVector = user.embedding;
        if (!otherVector || !Array.isArray(otherVector)) continue;
        if (!Array.isArray(myVector) || myVector.length === 0) {
          console.error('Smart-feed: invalid myVector for user', loggedInUser._id);
          continue;
        }
        // ensure vectors are compatible length-wise; if not, skip
        if (otherVector.length !== myVector.length) {
          // optionally, skip or compute using min length
          console.warn('Smart-feed: embedding length mismatch, skipping user', user._id);
          continue;
        }
        const similarity = cosineSimilarity(myVector, otherVector);
        if (Number.isFinite(similarity)) results.push({ user, similarity });
      } catch (e) {
        console.error('Smart-feed: similarity computation error for user', user._id, e.message);
        // skip this user on error
        continue;
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    let topUsers = results.map((r) => r.user);

    // If not enough results, fall back to returning recent users (without computing embeddings)
    if (topUsers.length < 10) {
      const fallback = await User.find({
        _id: { $nin: excludedArray },
      })
        .select("firstName lastName about skills photoURL")
        .sort({ createdAt: -1 })
        .limit(50);
      // append fallback users not already in topUsers
      const seen = new Set(topUsers.map((u) => u._id.toString()));
      for (const u of fallback) {
        if (!seen.has(u._id.toString())) topUsers.push(u);
      }
    }

    // Pagination support for smart feed
    const page = parseInt(req.query.page || 1, 10);
    let limit = parseInt(req.query.limit || 10, 10);
    limit = Math.min(limit, 50);
    const skip = (page - 1) * limit;

    const paged = topUsers.slice(skip, skip + limit);

    res.json({ data: paged, total: topUsers.length, page, limit, pages: Math.ceil(topUsers.length / limit) });
    
  } catch (err) {
    console.error("🔥 Smart feed error:", err.message, err.stack);
    res.status(500).send("Server error");
  }
});



userRouter.get("/user/test", (req, res) => {
  res.send("✅ User route working");
});

// Public: Get user by id (safe fields)
// Public: Get user by id (safe fields)
userRouter.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select(USER_SAFE_DATA + " photoURL about");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ data: user });
  } catch (error) {
    console.error("/user/:id error", error.message);
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
});

module.exports = userRouter;
