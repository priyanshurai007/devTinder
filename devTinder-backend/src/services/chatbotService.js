const axios = require("axios");
const User = require("../Models/user");

const EMBEDDING_API_URL =
  process.env.EMBEDDING_API_URL ||
  "https://priyanshurai439-smartfeed.hf.space/embed";

/**
 * Chatbot Service
 * Provides AI-powered recommendations and assistance
 */

class ChatbotService {
  /**
   * Get Profile Improvement Suggestions
   * Analyzes user profile and suggests improvements
   */
  static async getProfileSuggestions(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");

      const suggestions = [];

      // Check if skills are added
      if (!user.skills || user.skills.length === 0) {
        suggestions.push({
          category: "skills",
          priority: "high",
          suggestion:
            "Add your skills to help others find you! e.g., React, Node.js, Python, etc.",
          action: "Edit Profile",
        });
      }

      // Check if about section is filled
      if (!user.about || user.about.length < 20) {
        suggestions.push({
          category: "about",
          priority: "high",
          suggestion:
            "Write a compelling about section that describes your experience and what you're looking for.",
          action: "Edit Profile",
        });
      }

      // Check if age is set
      if (!user.age) {
        suggestions.push({
          category: "age",
          priority: "medium",
          suggestion: "Add your age to help others understand your demographic.",
          action: "Edit Profile",
        });
      }

      // Check if photo is uploaded
      if (
        !user.photoURL ||
        user.photoURL.includes("freepik.com") ||
        user.photoURL.includes("default")
      ) {
        suggestions.push({
          category: "photo",
          priority: "high",
          suggestion:
            "Upload a clear profile photo to increase connection chances by 5x!",
          action: "Upload Photo",
        });
      }

      // Check skills count
      if (user.skills && user.skills.length < 3) {
        suggestions.push({
          category: "skills",
          priority: "medium",
          suggestion: `You have ${user.skills.length} skills. Adding more will help you get matched with relevant people!`,
          action: "Edit Profile",
        });
      }

      return {
        success: true,
        suggestions,
        completeness: this.calculateProfileCompleteness(user),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get Connection Recommendations
   * Suggests users with similar skills
   */
  static async getConnectionRecommendations(userId, limit = 5) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");

      if (!user.skills || user.skills.length === 0) {
        return {
          success: true,
          recommendations: [],
          message: "Add skills to your profile for better recommendations!",
        };
      }

      // Find users with matching skills
      const recommendations = await User.find({
        _id: { $ne: userId },
        skills: { $in: user.skills },
      })
        .select("firstName lastName skills about photoURL age gender")
        .limit(limit)
        .sort({ createdAt: -1 });

      return {
        success: true,
        recommendations,
        reason: `Found users who share your skills: ${user.skills.join(", ")}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get Job/Role Recommendations
   * Suggests roles based on skills
   */
  static async getJobRecommendations(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");

      const recommendations = this.mapSkillsToRoles(user.skills || []);

      return {
        success: true,
        recommendations,
        message: "Based on your skills, you might be interested in these roles:",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate Response to User Message
   * Processes user queries and returns helpful responses
   */
  static async processMessage(userId, message) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");

      const lowerMessage = message.toLowerCase();

      // Profile help
      if (
        lowerMessage.includes("profile") ||
        lowerMessage.includes("improve")
      ) {
        const suggestions = await this.getProfileSuggestions(userId);
        return {
          response: `I see you want to improve your profile! Here are my suggestions:`,
          suggestions: suggestions.suggestions,
          type: "profile-help",
        };
      }

      // Connection recommendations
      if (
        lowerMessage.includes("connection") ||
        lowerMessage.includes("match") ||
        lowerMessage.includes("similar")
      ) {
        const recommendations = await this.getConnectionRecommendations(userId);
        return {
          response:
            recommendations.recommendations.length > 0
              ? `I found some great matches for you based on your skills!`
              : `No matches found yet. Try adding more skills to your profile!`,
          recommendations: recommendations.recommendations,
          type: "connections",
        };
      }

      // Skills help
      if (lowerMessage.includes("skill")) {
        const popularSkills = await this.getPopularSkills();
        return {
          response: `Great question! Here are the most in-demand skills right now:`,
          skills: popularSkills,
          type: "skills",
        };
      }

      // General greeting or question
      return {
        response: this.getRandomGreeting(user.firstName),
        suggestions: [
          { text: "Show my profile suggestions", action: "profile" },
          { text: "Find connections", action: "connections" },
          { text: "See job recommendations", action: "jobs" },
          { text: "Popular skills", action: "skills" },
        ],
        type: "general",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        response: "Sorry, I encountered an error. Please try again!",
      };
    }
  }

  /**
   * Helper: Calculate Profile Completeness
   */
  static calculateProfileCompleteness(user) {
    let score = 0;
    let maxScore = 5;

    if (user.skills && user.skills.length > 0) score++;
    if (user.about && user.about.length > 20) score++;
    if (user.age) score++;
    if (
      user.photoURL &&
      !user.photoURL.includes("freepik.com") &&
      !user.photoURL.includes("default")
    )
      score++;
    if (user.gender) score++;

    return {
      percentage: Math.round((score / maxScore) * 100),
      completed: score,
      total: maxScore,
    };
  }

  /**
   * Helper: Map Skills to Roles
   */
  static mapSkillsToRoles(skills) {
    const skillRoleMap = {
      react: ["Frontend Developer", "Full Stack Developer", "React Specialist"],
      "node.js": [
        "Backend Developer",
        "Full Stack Developer",
        "Node.js Specialist",
      ],
      python: ["Data Scientist", "Backend Developer", "Python Developer"],
      java: ["Backend Developer", "Enterprise Developer"],
      "machine learning": ["ML Engineer", "Data Scientist", "AI Engineer"],
      devops: ["DevOps Engineer", "Cloud Engineer"],
      aws: ["Cloud Architect", "DevOps Engineer"],
      docker: ["DevOps Engineer", "Cloud Engineer"],
      sql: ["Database Engineer", "Data Analyst"],
      javascript: ["Frontend Developer", "Full Stack Developer"],
    };

    const roles = new Set();

    skills.forEach((skill) => {
      const lowerSkill = skill.toLowerCase();
      Object.keys(skillRoleMap).forEach((key) => {
        if (lowerSkill.includes(key)) {
          skillRoleMap[key].forEach((role) => roles.add(role));
        }
      });
    });

    // Return top 5 unique roles
    return Array.from(roles).slice(0, 5);
  }

  /**
   * Helper: Get Popular Skills
   */
  static async getPopularSkills() {
    try {
      const skillStats = await User.aggregate([
        { $unwind: "$skills" },
        { $group: { _id: "$skills", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      return skillStats.map((stat) => ({
        skill: stat._id,
        count: stat.count,
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Helper: Get Random Greeting
   */
  static getRandomGreeting(userName) {
    const greetings = [
      `Hey ${userName}! 👋 How can I help you make meaningful connections today?`,
      `Welcome back ${userName}! 🚀 What would you like to work on?`,
      `Hi ${userName}! 💡 I'm here to help you grow your network and find opportunities.`,
      `${userName}! 🎯 Let's find you some amazing connections or improve your profile!`,
      `Welcome ${userName}! ✨ I can help you discover people, improve your profile, or answer questions.`,
    ];

    return greetings[Math.floor(Math.random() * greetings.length)];
  }
}

module.exports = ChatbotService;
