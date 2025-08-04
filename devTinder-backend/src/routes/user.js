const express = require("express");
const userRouter = express.Router();
const { userAuth } = require("../Middlewares/auth");
const { ConnectionRequestModel } = require("../Models/connectionRequest");
const User = require("../Models/user");

const getEmbedding = require("../utils/getEmbedding");
const cosineSimilarity = require("../utils/cosineSimilarity");


const USER_SAFE_DATA = "firstName lastName photoURL about age gender skills";

userRouter.get("/user/requests/recieved", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const connectionRequests = await ConnectionRequestModel.find({
      toUserId: loggedInUser._id,
      status: "intrested",
    }).populate("fromUserId", USER_SAFE_DATA);
    if (connectionRequests) {
      return res.status(200).json({
        connectionRequests,
      });
    }
  } catch (error) {
    res.status(400).send("ERROR:" + error.message);
  }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    console.log(loggedInUser);
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

    res.status(200).json({
      data,
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

    const connectionRequest = await ConnectionRequestModel.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId toUserId");

    const hideUsersFromFeed = new Set();
    connectionRequest.forEach((req) => {
      hideUsersFromFeed.add(req.fromUserId.toString());
      hideUsersFromFeed.add(req.toUserId.toString());
    });

    const users = await User.find({
      $and: [
        { _id: { $nin: Array.from(hideUsersFromFeed) } },
        { _id: { $ne: loggedInUser._id } },
      ],
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
    const skills = Array.isArray(loggedInUser.skills) ? loggedInUser.skills.join(" ") : "";
    const about = loggedInUser.about || "";
    const inputText = `${skills} ${about}`.trim();

    if (!inputText) {
      return res.status(400).send("User profile incomplete for embedding.");
    }

    const myVector = await getEmbedding(inputText);
    if (!myVector) {
      console.error("❌ Failed to get embedding for:", inputText);
      return res.status(500).send("Embedding failed");
    }

    // Exclude self + connected/requested
    const requests = await ConnectionRequestModel.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    });

    const excludedIds = new Set([loggedInUser._id.toString()]);
    requests.forEach((r) => {
      excludedIds.add(r.fromUserId.toString());
      excludedIds.add(r.toUserId.toString());
    });

    const otherUsers = await User.find({
      _id: { $nin: Array.from(excludedIds) },
    }).select("firstName lastName about skills photoURL");

    const results = [];

    for (const user of otherUsers) {
      const userSkills = Array.isArray(user.skills) ? user.skills.join(" ") : "";
      const userAbout = user.about || "";
      const otherText = `${userSkills} ${userAbout}`.trim();

      if (!otherText) {
        console.warn(`⚠️ Skipping user with empty profile: ${user.firstName}`);
        continue;
      }

      const otherVector = await getEmbedding(otherText);
      if (!otherVector) {
        console.warn(`⚠️ Embedding failed for user: ${user.firstName}`);
        continue;
      }

      const similarity = cosineSimilarity(myVector, otherVector);
      results.push({ user, similarity });
    }

    results.sort((a, b) => b.similarity - a.similarity);
    const topUsers = results.map((r) => r.user);

    console.log(`✅ Smart feed generated for ${loggedInUser.emailId}, top:`, topUsers.map(u => u.firstName));
    res.json(topUsers);
    
  } catch (err) {
    console.error("🔥 Smart feed error:", err.message, err.stack);
    res.status(500).send("Server error");
  }
});



userRouter.get("/user/test", (req, res) => {
  res.send("✅ User route working");
});

module.exports = userRouter;
