const express = require("express");
const connectDB = require("./src/Config/database");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config(); // ✅ Load env variables

const app = express();

// ✅ Recommended: Set frontend URL as a variable
const FRONTEND_URL = "https://devtinder-vqbx.onrender.com";

// ✅ CORS setup
app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true, // ✅ Allow cookies, headers, etc.
  })
);

app.use(express.json());
app.use(cookieParser());

// ✅ Routes
const authRouter = require("./src/routes/auth");
const profileRouter = require("./src/routes/profile");
const requestRouter = require("./src/routes/request");
const userRouter = require("./src/routes/user");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);

// ✅ Connect DB and Start Server
connectDB().then(() => {
  try {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server running on ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Server Error:", error.message);
  }
});
