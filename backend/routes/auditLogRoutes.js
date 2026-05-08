const express = require("express");
const { getAuditLogs } = require("../controllers/auditLogController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", verifyToken, requireAdmin, getAuditLogs);

module.exports = router;
