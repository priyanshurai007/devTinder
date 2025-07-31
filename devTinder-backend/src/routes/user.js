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


//smart-feed using cosine similarity
// This endpoint provides a smart feed of users based on cosine similarity of skills and about text
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

    const hideUsersFromFeed = new Set([loggedInUser._id.toString()]);
    connectionRequest.forEach((req) => {
      hideUsersFromFeed.add(req.fromUserId.toString());
      hideUsersFromFeed.add(req.toUserId.toString());
    });

    const inputSkills = Array.isArray(loggedInUser.skills) ? loggedInUser.skills.join(" ") : "";
    const inputAbout = loggedInUser.about || "";
    const inputText = `${inputSkills} ${inputAbout}`.trim();
    if (!inputText) return res.status(400).send("Incomplete profile");

    const myVector = await getEmbedding(inputText);
    if (!myVector) return res.status(500).send("Embedding failed");

    const users = await User.find({
      _id: { $nin: Array.from(hideUsersFromFeed) },
    }).select("firstName lastName photoURL about age gender skills");

    const results = [];

    for (const user of users) {
      const userSkills = Array.isArray(user.skills) ? user.skills.join(" ") : "";
      const userAbout = user.about || "";
      const profileText = `${userSkills} ${userAbout}`.trim();

      if (!profileText) continue;

      const userVector = await getEmbedding(profileText);
      if (!userVector) continue;

      const similarity = cosineSimilarity(myVector, userVector);
      results.push({ user, similarity });
    }

    // Sort by similarity
    results.sort((a, b) => b.similarity - a.similarity);

    // Paginate after sorting
    const paginated = results.slice(skip, skip + limit).map(r => r.user);

    res.status(200).json(paginated);
  } catch (error) {
    console.error("🔥 Smart Feed error:", error.message);
    res.status(500).send("ERROR: " + error.message);
  }
});


userRouter.get("/user/test", (req, res) => {
  res.send("✅ User route working");
});

module.exports = userRouter;
