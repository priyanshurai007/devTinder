const express = require("express");
const connectDB = require("./src/Config/database");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();
const http = require("http");
const { Server } = require("socket.io");
let helmet;
let rateLimit;
try {
  helmet = require('helmet');
} catch (e) {
  console.warn('Optional dependency "helmet" not installed. Skipping security headers.');
}
try {
  rateLimit = require('express-rate-limit');
} catch (e) {
  console.warn('Optional dependency "express-rate-limit" not installed. Skipping rate limiting.');
}

const app = express();

// Trust proxy - required when behind Render/Vercel/Nginx reverse proxy
// This allows express-rate-limit to correctly identify users via X-Forwarded-For
app.set('trust proxy', 1);

/*
  Allow both local dev and deployed frontend.
  To customize, set `FRONTEND_URL` in your environment. You can supply
  a single origin or a comma-separated list of origins.
*/
const defaultOrigins = [
  "http://localhost:5173",
  "https://devtinder-vqbx.onrender.com",
];

// Allow an env var FRONTEND_URL (single or comma-separated) to extend/override origins
const envFrontends = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = [...defaultOrigins, ...envFrontends].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow REST tools w/out origin (Postman, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS blocked from origin: " + origin), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Content-Length"],
  })
);

// Basic security headers (optional)
if (helmet) {
  app.use(helmet());
} else {
  // no-op if helmet missing
}

// Rate limiting (optional)
if (rateLimit) {
  // Global basic rate limiter (protect against abuse)
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 300, // max requests per IP per window
  });
  app.use(globalLimiter);

  // Tighter rate limit for auth endpoints (login/signup)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per window
    message: { message: "Too many requests, please try again later" },
  });

  // Apply authLimiter to auth endpoints before mounting the router
  app.use('/signup', authLimiter);
  app.use('/login', authLimiter);
} else {
  // rate limiting not available
}

// Parse JSON + cookies
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ---- Routes ----
const authRouter = require("./src/routes/auth");
const profileRouter = require("./src/routes/profile");
const requestRouter = require("./src/routes/request");
const userRouter = require("./src/routes/user");
const uploadRouter = require("./src/routes/upload"); // <-- NEW
const chatRouter = require("./src/routes/chat"); // <-- New
const referralRouter = require("./src/routes/referral");
const searchRouter = require("./src/routes/search"); // <-- NEW SEARCH
const chatbotRouter = require("./src/routes/chatbot"); // <-- NEW CHATBOT

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", uploadRouter); // <-- NEW
app.use("/", chatRouter);// <-- New
app.use("/", referralRouter); //<-- New
app.use("/search", searchRouter); // <-- NEW SEARCH
// app.use("/", chatbotRouter); // <-- NEW CHATBOT


// Health check (nice for Render)
app.get("/health", (req, res) => res.send("ok"));

// ---- Start Server AFTER DB ----
connectDB().then(() => {
  const port = process.env.PORT || 3000;
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  // Socket auth handshake: verify JWT from cookie and attach socket.userId
  const jwt = require('jsonwebtoken');
  const User = require('./src/Models/user');
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers?.cookie || '';
      const match = cookieHeader.match(/token=([^;]+)/);
      const token = match ? match[1] : null;
      if (!token) return next(new Error('Authentication error'));
      const decoded = await jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded._id).select('_id');
      if (!user) return next(new Error('Authentication error'));
      socket.userId = user._id.toString();
      return next();
    } catch (err) {
      return next(new Error('Authentication error'));
    }
  });

  io.on("connection", (socket) => {
    console.log(`socket connected: ${socket.id} user:${socket.userId}`);

    // join personal room (allows server -> user notifications)
    try {
      socket.join(`user_${socket.userId}`);
    } catch (e) {}

    // join chat room - reply with an ack event so clients can confirm join
    socket.on("joinRoom", (roomId) => {
      try {
        socket.join(roomId);
        socket.emit('joinedRoom', roomId);
        const roomSockets = io.sockets.adapter.rooms.get(roomId);
        const count = roomSockets ? roomSockets.size : 0;
        console.log(`socket ${socket.id} (user:${socket.userId}) joined room ${roomId} - now ${count} user(s) in room`);
      } catch (e) {
        console.warn('joinRoom error', e && e.message);
      }
    });

    // leave chat room
    socket.on("leaveRoom", (roomId) => {
      try {
        socket.leave(roomId);
        console.log(`socket ${socket.id} (user:${socket.userId}) left room ${roomId}`);
      } catch (e) {
        console.warn('leaveRoom error', e && e.message);
      }
    });

    // message event: accept optional tempId for optimistic updates
    socket.on("sendMessage", async ({ roomId, senderId, message, tempId }) => {
      if (!message?.trim()) return;

      try {
        console.log(`sendMessage from socket ${socket.id} user:${socket.userId} room:${roomId}`);
        // validate that socket.userId matches senderId
        if (socket.userId !== (senderId || '').toString()) {
          console.warn('sendMessage: senderId mismatch', { socketUser: socket.userId, senderId });
          return;
        }

        const ChatRoom = require('./src/Models/chatRoom');
        const Message = require('./src/Models/message');

        const room = await ChatRoom.findById(roomId);
        if (!room) {
          console.warn('sendMessage: room not found', roomId);
          return;
        }

        // ensure sender is a member
        const memberIds = room.members.map(m => m.toString());
        if (!memberIds.includes(socket.userId)) {
          console.warn('sendMessage: sender not a member', { socketUser: socket.userId, members: memberIds });
          return;
        }

        const newMsg = await Message.create({ chatRoomId: roomId, senderId, message });
        // populate sender fields for client display
        await newMsg.populate('senderId', 'firstName lastName photoURL');

        // send ack to sender with saved message (so client can replace optimistic message)
        socket.emit('messageSaved', { tempId, message: newMsg });

        // broadcast to ALL users in the room (including sender for consistency)
        io.to(roomId).emit('receiveMessage', newMsg);
        console.log(`message broadcast from ${socket.id} to room ${roomId} (all users)`);
      } catch (e) {
        console.warn('sendMessage error', e && e.message);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`socket disconnected: ${socket.id} reason:${reason}`);
    });
  });

  // expose io on global so route handlers can notify users (simple but effective)
  global.io = io;

  server.listen(port, () => console.log(`Server running on ${port}`));
});
// Note: server exit on unhandled rejections will help surface DB/connect issues during dev
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});