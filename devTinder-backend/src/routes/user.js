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
      // Build a list of "other" user ids for each accepted connection (the user who is NOT the logged-in user).
      const otherIds = [];
      const myIdStr = String(loggedInUser._id);
      for (const row of connectionRequests) {
        try {
          const fromId = row.fromUserId && (row.fromUserId._id ? String(row.fromUserId._id) : String(row.fromUserId));
          const toId = row.toUserId && (row.toUserId._id ? String(row.toUserId._id) : String(row.toUserId));
          if (fromId === myIdStr && toId) otherIds.push(toId);
          else if (toId === myIdStr && fromId) otherIds.push(fromId);
        } catch (e) {
          // ignore malformed rows
        }
      }

      // Deduplicate ids and paginate the id list (so we can fetch real user docs)
      let uniqueIds = Array.from(new Set(otherIds));
      // Defensive: remove any occurrence of the logged-in user's id (avoid returning self)
      uniqueIds = uniqueIds.filter((id) => id && id !== myIdStr);
      const total = uniqueIds.length;
      const pagedIds = uniqueIds.slice(skip, skip + limit);

      // Fetch the User documents for the paged ids (preserve safe fields).
      const usersFound = await User.find({ _id: { $in: pagedIds } }).select(USER_SAFE_DATA);

      // Map users by id for stable ordering and defensive filtering
      const userById = new Map(usersFound.map((u) => [String(u._id), u]));

      const orderedUsers = pagedIds
        .map((id) => {
          const sid = String(id);
          if (sid === myIdStr) return null; // never return self
          return userById.get(sid) || null;
        })
        .filter(Boolean);

      res.status(200).json({
        data: orderedUsers,
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

    // Exclude self and users with ANY connection request (sent or received, any status)
    const connectionRequest = await ConnectionRequestModel.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
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

    // Pagination
    const page = parseInt(req.query.page || 1, 10);
    let limit = parseInt(req.query.limit || 10, 10);
    limit = Math.min(limit, 50);
    const skip = (page - 1) * limit;

    // Get ALL connection requests for the logged-in user (any status)
    const requests = await ConnectionRequestModel.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    });

    // Build exclusion set (self + all users with any connection request)
    const excludedIds = new Set([String(loggedInUser._id)]);
    for (const r of requests) {
      try {
        const fromId = r.fromUserId && r.fromUserId.toString && r.fromUserId.toString();
        const toId = r.toUserId && r.toUserId.toString && r.toUserId.toString();
        if (fromId && fromId !== String(loggedInUser._id)) excludedIds.add(fromId);
        if (toId && toId !== String(loggedInUser._id)) excludedIds.add(toId);
      } catch (e) {
        // ignore
      }
    }

    // Convert exclusion list to ObjectId array for Mongo queries
    const excludedArray = Array.from(excludedIds)
      .map((id) => {
        try {
          return mongoose.Types.ObjectId(id);
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);

    // Determine user's embedding (if missing, attempt best-effort compute)
    let myVector = Array.isArray(loggedInUser.embedding) ? loggedInUser.embedding : null;
    if (!myVector) {
      try {
        const skillsText = Array.isArray(loggedInUser.skills) ? loggedInUser.skills.join(" ") : "";
        const input = `${skillsText} ${loggedInUser.about || ""}`.trim();
        if (input) myVector = await getEmbedding(input);
      } catch (e) {
        // best-effort: proceed without embedding
        myVector = null;
      }
    }

    // Find users with embeddings (excluding connected users)
    const otherUsersWithEmbeddings = await User.find({
      _id: { $nin: excludedArray },
      embedding: { $exists: true, $ne: [] },
    }).select("firstName lastName about skills photoURL embedding");

    // Compute similarity if we have a vector
    const results = [];
    if (Array.isArray(myVector) && myVector.length > 0) {
      for (const user of otherUsersWithEmbeddings) {
        try {
          const otherVector = user.embedding;
          if (!otherVector || !Array.isArray(otherVector)) continue;
          if (otherVector.length !== myVector.length) continue;
          const similarity = cosineSimilarity(myVector, otherVector);
          if (Number.isFinite(similarity)) results.push({ user, similarity });
        } catch (e) {
          // skip user
        }
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    let topUsers = results.map((r) => r.user);

    // Fallback to recent users if not enough similarity-based results
    if (topUsers.length < 10) {
      const fallback = await User.find({ _id: { $nin: excludedArray } })
        .select("firstName lastName about skills photoURL")
        .sort({ createdAt: -1 })
        .limit(50);
      const seen = new Set(topUsers.map((u) => String(u._id)));
      for (const u of fallback) if (!seen.has(String(u._id))) topUsers.push(u);
    }

    const total = topUsers.length;
    const paged = topUsers.slice(skip, skip + limit);
    return res.json({ data: paged, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("🔥 Smart feed error:", err && err.message ? err.message : err);
    return res.status(500).send("Server error");
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
