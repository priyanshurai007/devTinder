const express = require("express");
const router = express.Router();
const auth = require("../Middlewares/auth");
const ChatbotService = require("../services/chatbotService");

/**
 * POST /chatbot/message
 * Send a message to the chatbot and get a response
 */
router.post("/chatbot/message", auth, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        message: "Message cannot be empty",
      });
    }

    const response = await ChatbotService.processMessage(userId, message);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    const payload = {
      success: false,
      message: "Error processing chatbot message",
      error: error.message,
    };
    if (process.env.NODE_ENV !== "production") payload.details = error.stack;
    res.status(500).json(payload);
  }
});

/**
 * GET /chatbot/suggestions
 * Get initial suggestions for user
 */
router.get("/chatbot/suggestions", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get profile suggestions
    const profileSuggestions =
      await ChatbotService.getProfileSuggestions(userId);

    // Get connection recommendations
    const connectionRecommendations =
      await ChatbotService.getConnectionRecommendations(userId, 3);

    // Get job recommendations
    const jobRecommendations = await ChatbotService.getJobRecommendations(
      userId
    );

    res.json({
      success: true,
      data: {
        profile: profileSuggestions,
        connections: connectionRecommendations,
        jobs: jobRecommendations,
      },
    });
  } catch (error) {
    const payload = {
      success: false,
      message: "Error fetching suggestions",
      error: error.message,
    };
    if (process.env.NODE_ENV !== "production") payload.details = error.stack;
    res.status(500).json(payload);
  }
});

/**
 * GET /chatbot/profile-suggestions
 * Get suggestions to improve user profile
 */
router.get("/chatbot/profile-suggestions", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const suggestions = await ChatbotService.getProfileSuggestions(userId);

    // Include a friendly message so frontend can display bot text
    res.json({
      success: true,
      data: {
        message: "Here are some suggestions to improve your profile.",
        ...suggestions,
      },
    });
  } catch (error) {
    const payload = {
      success: false,
      message: "Error fetching profile suggestions",
      error: error.message,
    };
    if (process.env.NODE_ENV !== "production") payload.details = error.stack;
    res.status(500).json(payload);
  }
});

/**
 * GET /chatbot/connection-recommendations
 * Get connection recommendations based on skills
 */
router.get("/chatbot/connection-recommendations", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = req.query.limit || 5;
    const recommendations =
      await ChatbotService.getConnectionRecommendations(userId, limit);

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    const payload = {
      success: false,
      message: "Error fetching connection recommendations",
      error: error.message,
    };
    if (process.env.NODE_ENV !== "production") payload.details = error.stack;
    res.status(500).json(payload);
  }
});

/**
 * GET /chatbot/job-recommendations
 * Get job/role recommendations based on skills
 */
router.get("/chatbot/job-recommendations", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const recommendations = await ChatbotService.getJobRecommendations(userId);

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    const payload = {
      success: false,
      message: "Error fetching job recommendations",
      error: error.message,
    };
    if (process.env.NODE_ENV !== "production") payload.details = error.stack;
    res.status(500).json(payload);
  }
});

/**
 * GET /chatbot/popular-skills
 * Get popular skills across platform
 */
router.get("/chatbot/popular-skills", auth, async (req, res) => {
  try {
    const skills = await ChatbotService.getPopularSkills();

    res.json({
      success: true,
      data: skills,
    });
  } catch (error) {
    const payload = {
      success: false,
      message: "Error fetching popular skills",
      error: error.message,
    };
    if (process.env.NODE_ENV !== "production") payload.details = error.stack;
    res.status(500).json(payload);
  }
});

module.exports = router;
