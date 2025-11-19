const jwt = require("jsonwebtoken");
const User = require("../Models/user");
const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies || {};
    // DEV DEBUG: log when no token present or when token decoded (removed in prod)
    if (!token) {
      return res.status(401).send("Please Login or Signup");
    }

    const deocodedObj = await jwt.verify(token, process.env.JWT_SECRET);
    const { _id } = deocodedObj || {};

    const user = await User.findById(_id);
    if (!user) {
      throw new Error("User Not Found");
    }
    // attach user to request for downstream handlers
    req.user = user;
    next();
  } catch (err) {
    // Avoid leaking internal error details. Return 401 for any auth failure.
    return res.status(401).json({ message: "Authentication required" });
  }
};

module.exports = userAuth;
// Backwards-compatible named export for files using destructuring: { userAuth }
module.exports.userAuth = userAuth;
