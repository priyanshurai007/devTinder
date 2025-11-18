const express = require("express");
const profileRouter = express.Router();
const { userAuth } = require("../Middlewares/auth");
const { validateEditFields } = require("../utils/validation");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Multer setup (store file in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// ------------------------------
// View Profile
// ------------------------------
profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json({ user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ------------------------------
// Edit Profile
// ------------------------------
profileRouter.post("/profile/edit", userAuth, async (req, res) => {
  try {
    if (!validateEditFields(req)) {
      return res.status(400).json({ message: "Invalid edit request" });
    }

    const loggedInUser = req.user;
    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));
    await loggedInUser.save();

    res.status(200).json({
      message: `${loggedInUser.firstName}, your profile updated successfully`,
      data: loggedInUser,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ------------------------------
// Upload Profile Photo (NEW)
// ------------------------------
profileRouter.post("/profile/photo", userAuth, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "devtinder_profiles" },
      async (error, result) => {
        if (error) return res.status(500).json({ message: "Upload failed", error });

        // ✅ Update user's photoURL in DB
        req.user.photoURL = result.secure_url;
        await req.user.save();

        res.status(200).json({ photoURL: result.secure_url, user: req.user });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = profileRouter;
