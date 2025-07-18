const express = require("express");
const connectDB = require("./src/Config/database");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();

const app = express();

/*
  Allow both local dev and deployed frontend.
  If you want to restrict strictly in prod, set FRONTEND_URL in .env and use that only.
*/
const allowedOrigins = [
  "http://localhost:5173",
  "https://devtinder-vqbx.onrender.com",
].filter(Boolean); // avoid undefineds

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

// Parse JSON + cookies
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ---- Routes ----
const authRouter = require("./src/routes/auth");
const profileRouter = require("./src/routes/profile");
const requestRouter = require("./src/routes/request");
const userRouter = require("./src/routes/user");
const uploadRouter = require("./src/routes/upload"); // <-- NEW

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", uploadRouter); // <-- NEW

// Health check (nice for Render)
app.get("/health", (req, res) => res.send("ok"));

// ---- Start Server AFTER DB ----
connectDB().then(() => {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on ${port}`);
  });
});
