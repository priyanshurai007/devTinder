const express = require("express");
const authRouter = express.Router();
const User = require("../Models/user");
const getEmbedding = require("../utils/getEmbedding");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { validateSignupData } = require("../utils/validation");

//signup api for signing the user
authRouter.post("/signup", async (req, res) => {
  try {
    // Validate the data
    validateSignupData(req);
    const {
      firstName,
      lastName,
      emailId,
      password,
      age,
      gender,
      about,
      skills,
    } = req.body;
    // Encrypt the password
    const passwordHash = await bcrypt.hash(password, 10);

    const checkEmail = await User.findOne({ emailId });
    if (checkEmail) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
      age,
      gender,
      about,
      skills,
    });
    // attempt to compute embedding (best-effort). If embedding service fails,
    // continue without blocking signup.
    try {
      const skillsText = Array.isArray(skills) ? skills.join(" ") : "";
      const inputText = `${skillsText} ${about || ""}`.trim();
      const embedding = await getEmbedding(inputText);
      if (Array.isArray(embedding) && embedding.length > 0) {
        user.embedding = embedding;
        user.embeddingUpdatedAt = new Date();
      }
    } catch (e) {
      // silent: do not surface embedding failures to users
    }

    const savedUser = await user.save(); // save and return the saved document
    const token = await savedUser.getjwt();

    // Determine if we're in production (Render, Vercel, or NODE_ENV set)
    // On Render, X-Forwarded-Proto header is "https" for HTTPS requests
    const isHttps = req.get('x-forwarded-proto') === 'https' || process.env.NODE_ENV === 'production';
    const isProd = isHttps || process.env.RENDER === "true" || process.env.VERCEL === "1";
    
    // When running in production (HTTPS) we set SameSite='None' and Secure=true
    // For local development over HTTP, setting SameSite='None' without Secure
    // can cause modern browsers to reject the cookie. Use 'Lax' locally.
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: isProd ? "None" : "Lax",
      secure: isProd, // secure only on HTTPS
      expires: new Date(Date.now() + 8 * 3600000), // 8 hours
    });

    // Sanitize user object before returning (remove sensitive fields)
    const safeUser = savedUser.toObject();
    delete safeUser.password;
    delete safeUser.embedding;
    delete safeUser.embeddingUpdatedAt;
    res.status(201).json({ message: "User added successfully", data: safeUser });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;
    if (!validator.isEmail(emailId)) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = await user.getjwt();
    // Determine if we're in production (Render, Vercel, or NODE_ENV set)
    const isHttps = req.get('x-forwarded-proto') === 'https' || process.env.NODE_ENV === 'production';
    const isProd = isHttps || process.env.RENDER === "true" || process.env.VERCEL === "1";
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: isProd ? "None" : "Lax",
      secure: isProd,
      expires: new Date(Date.now() + 8 * 3600000),
    });
    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.embedding;
    delete safeUser.embeddingUpdatedAt;
    res.status(200).json({ user: safeUser });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

authRouter.post("/logout", async (req, res) => {
  const isHttps = req.get('x-forwarded-proto') === 'https' || process.env.NODE_ENV === 'production';
  const isProd = isHttps || process.env.RENDER === "true" || process.env.VERCEL === "1";
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    sameSite: isProd ? "None" : "Lax",
    secure: isProd,
  });
  res.status(200).json({ message: "User logged out successfully" });
});

// Temporary debug endpoints (safe: do NOT expose secrets)
// Use these to inspect how the server detects production and what headers arrive
authRouter.get('/debug/env', (req, res) => {
  const isHttps = req.get('x-forwarded-proto') === 'https' || process.env.NODE_ENV === 'production';
  const isProd = isHttps || process.env.RENDER === 'true' || process.env.VERCEL === '1';
  res.json({
    isHttps,
    isProd,
    NODE_ENV: process.env.NODE_ENV || null,
    RENDER: process.env.RENDER || null,
    x_forwarded_proto: req.get('x-forwarded-proto') || null,
    host: req.get('host') || null,
  });
});

// Return incoming request headers so you can confirm whether cookies or proto headers arrive
authRouter.get('/debug/headers', (req, res) => {
  // echo request headers (non-sensitive) for debugging
  const headers = { ...req.headers };
  // mask common sensitive headers just in case
  if (headers.authorization) headers.authorization = '[REDACTED]';
  res.json({ headers });
});

module.exports = authRouter;
