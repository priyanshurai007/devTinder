// src/routes/upload.js
const express = require("express");
const { userAuth } = require("../Middlewares/auth");
const multer = require("multer");
const sharp = require("sharp");
const streamifier = require("streamifier");
const cloudinary = require("../utils/cloudinary");

const uploadRouter = express.Router();

// store file in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG/PNG/WEBP images allowed"));
    }
    cb(null, true);
  },
});

uploadRouter.post("/profile/photo", userAuth, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) throw new Error("No file uploaded.");

    // optional compression/resize
    const processed = await sharp(req.file.buffer)
      .resize(512, 512, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();

    // upload via stream (no temp file needed)
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "devtinder/users",
        public_id: req.user._id.toString(), // overwrite per user
        overwrite: true,
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      async (err, result) => {
        if (err) {
          console.error("Cloudinary error:", err);
          return res.status(500).send("ERROR: Upload failed");
        }

        // save URL to user
        req.user.photoURL = result.secure_url;
        await req.user.save();

        res.json({
          message: "Photo updated",
          photoURL: result.secure_url,
        });
      }
    );

    streamifier.createReadStream(processed).pipe(stream);
  } catch (error) {
    console.error(error);
    res.status(400).send("ERROR: " + error.message);
  }
});

module.exports = uploadRouter;
