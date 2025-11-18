const express = require("express");
const router = express.Router();
const User = require("../Models/user");
const { ConnectionRequestModel } = require("../Models/connectionRequest");
const auth = require("../Middlewares/auth");

/**
 * Search Users Route
 * GET /search?query=...&skill=...&ageMin=...&ageMax=...&gender=...&page=...&limit=...
 * 
 * Query Parameters:
 * - query: Search term (searches firstName, lastName, skills)
 * - skill: Filter by specific skill
 * - ageMin: Minimum age
 * - ageMax: Maximum age
 * - gender: Filter by gender
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 10)
 */
/**
 * Search Suggestions MUST COME FIRST
 * GET /search/suggestions?query=...
 * 
 * Returns autocomplete suggestions for search
 */
// Public suggestions (no auth) - allows client-side autocomplete even when cookies are blocked
router.get("/suggestions", async (req, res) => {
  try {
    const { query = "" } = req.query;
    const currentUserId = req.user?._id || null;

    if (!query || query.length < 2) {
      return res.json({ data: [] });
    }

    // Get name suggestions
    const nameSuggestions = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
      ],
    })
      .select("firstName lastName")
      .limit(5);

    // Get skill suggestions
    const skillSuggestions = await User.aggregate([
      {
        $match: {
          skills: { $regex: query, $options: "i" },
        },
      },
      { $unwind: "$skills" },
      {
        $match: {
          skills: { $regex: query, $options: "i" },
        },
      },
      {
        $group: { _id: "$skills", count: { $sum: 1 } },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      data: {
        // Return name suggestions as objects so frontend can navigate to profiles directly
        names: nameSuggestions.map((u) => ({ _id: u._id, name: `${u.firstName} ${u.lastName}` })),
        skills: skillSuggestions.map((s) => s._id),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching suggestions",
      error: error.message,
    });
  }
});

/**
 * Get Popular Skills MUST COME SECOND
 * GET /search/skills/popular
 * 
 * Returns most common skills across all users
 */
// Public popular skills (no auth) - safe to expose aggregate stats
router.get("/skills/popular", async (req, res) => {
  try {
    // Aggregate to get skill frequencies
    const skillStats = await User.aggregate([
      { $unwind: "$skills" },
      { $group: { _id: "$skills", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    const skills = skillStats.map((stat) => ({
      name: stat._id,
      count: stat.count,
    }));

    res.json({ data: skills });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching popular skills",
      error: error.message,
    });
  }
});

/**
 * Advanced Search with Skills Matching MUST COME THIRD
 * GET /search/advanced?skills=...&limit=...
 * 
 * Returns users with matching skills sorted by relevance
 */
router.get("/advanced", auth, async (req, res) => {
  try {
    const { skills = "", limit = 10 } = req.query;
    const currentUserId = req.user._id;

    if (!skills) {
      return res.status(400).json({ message: "Skills parameter required" });
    }

    const skillsArray = skills.split(",").map((s) => s.trim());

    // Find users with matching skills
    const users = await User.find({
      _id: { $ne: currentUserId },
      skills: { $in: skillsArray },
    })
      .select("firstName lastName age gender skills about photoURL")
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      data: users,
      total: users.length,
      matchedSkills: skillsArray,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error in advanced search",
      error: error.message,
    });
  }
});

/**
 * Generic Search Users Route MUST COME LAST
 * GET /search?query=...&skill=...&ageMin=...&ageMax=...&gender=...&page=...&limit=...
 * 
 * Query Parameters:
 * - query: Search term (searches firstName, lastName, skills)
 * - skill: Filter by specific skill
 * - ageMin: Minimum age
 * - ageMax: Maximum age
 * - gender: Filter by gender
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 10)
 */
// Main search: allow anonymous access. If req.user is present we will exclude connected users,
// otherwise return results across the DB (useful for public discovery or when cookies blocked).
router.get("", async (req, res) => {
  try {
    const {
      query = "",
      skill = "",
      ageMin = 18,
      ageMax = 100,
      gender = "",
      page = 1,
      limit = 10,
    } = req.query;
    const currentUserId = req.user?._id || null;

    // Build search filter
    const filter = {};

    // Search in name and skills
    if (query) {
      filter.$or = [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        { skills: { $regex: query, $options: "i" } },
      ];
    }

    // Filter by specific skill
    if (skill) {
      // Use case-insensitive regex match on skills array elements
      // $in with RegExp can be unreliable in some drivers, use $elemMatch instead
      filter.skills = { $elemMatch: { $regex: skill, $options: "i" } };
    }

    // Filter by age range
    if (ageMin || ageMax) {
      filter.age = {};
      if (ageMin) filter.age.$gte = parseInt(ageMin);
      if (ageMax) filter.age.$lte = parseInt(ageMax);
    }

    // Filter by gender
    if (gender) {
      filter.gender = { $regex: gender, $options: "i" };
    }

    // If there's an authenticated user, exclude them and any users with a connection request record
    if (currentUserId) {
      // Exclude users who have an active relationship with current user.
      // Only consider requests/relationships that represent interest/connection
      // (pending, intrested, accepted). This prevents showing users the
      // current user has already requested or are already connected with.
      const activeStatuses = ["pending", "intrested", "accepted"];
      const connectionRequests = await ConnectionRequestModel.find({
        $or: [{ fromUserId: currentUserId }, { toUserId: currentUserId }],
        status: { $in: activeStatuses },
      }).select("fromUserId toUserId");

      const hideUsers = new Set();
      connectionRequests.forEach((r) => {
        if (r.fromUserId) hideUsers.add(r.fromUserId.toString());
        if (r.toUserId) hideUsers.add(r.toUserId.toString());
      });
      // always exclude current user
      hideUsers.add(currentUserId.toString());

      filter._id = { $nin: Array.from(hideUsers) };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Optional debug logging to help troubleshoot search filters
    // Enable by setting LOG_SEARCH_FILTERS=true in .env
    try {
      if (process.env.LOG_SEARCH_FILTERS === "true") {
        console.debug("[search] filter:", JSON.stringify(filter));
        console.debug("[search] pagination:", { skip, limit, page });
      }
    } catch (e) {
      // swallow logging errors
    }

    // Execute search with sorting
    const users = await User.find(filter)
      .select("firstName lastName age gender skills about photoURL")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Optional debug: log results count
    try {
      if (process.env.LOG_SEARCH_FILTERS === "true") {
        console.debug("[search] results:", { found: users.length, total });
      }
    } catch (e) {}

    res.json({
      data: users,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error searching users",
      error: error.message,
    });
  }
});

module.exports = router;

/**
 * DEV: Debug search route (temporary)
 * POST /search/debug
 * Body: { filter?: object, sampleLimit?: number }
 * Enabled only when LOG_SEARCH_DEBUG=true in .env and requires auth
 */
router.post("/debug", auth, async (req, res) => {
  try {
    if (process.env.LOG_SEARCH_DEBUG !== "true") {
      return res.status(403).json({ message: "Debug endpoint disabled" });
    }

    // Accept a custom filter from body or fall back to query params
    const { filter = {}, sampleLimit = 5 } = req.body;

    // sanitize basic fields: prevent projection or operators sneaking in
    const safeFilter = filter || {};

    const count = await User.countDocuments(safeFilter);
    const samples = await User.find(safeFilter)
      .select("firstName lastName skills photoURL about age gender")
      .limit(parseInt(sampleLimit, 10));

    res.json({ success: true, filter: safeFilter, count, samples });
  } catch (err) {
    console.error("/search/debug error", err.stack || err.message);
    res.status(500).json({ success: false, message: "Debug failed", error: err.message });
  }
});
