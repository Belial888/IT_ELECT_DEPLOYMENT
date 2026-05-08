const express = require("express");
const {
  completeTwoFactorLogin,
  disableTwoFactor,
  enableTwoFactor,
  login,
  me,
  register,
  resendVerification,
  setupTwoFactor,
  verifyEmail
} = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/login", login);
router.post("/login/2fa", completeTwoFactorLogin);
router.get("/me", verifyToken, me);
router.post("/2fa/setup", verifyToken, setupTwoFactor);
router.post("/2fa/enable", verifyToken, enableTwoFactor);
router.post("/2fa/disable", verifyToken, disableTwoFactor);

module.exports = router;
