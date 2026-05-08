const express = require("express");
const {
  createSupportRequest,
  getMyRequests,
  getAllRequests,
  updateRequestStatus,
  deleteSupportRequest
} = require("../controllers/supportController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", verifyToken, createSupportRequest);
router.get("/my", verifyToken, getMyRequests);
router.get("/", verifyToken, requireAdmin, getAllRequests);
router.put("/:id/status", verifyToken, requireAdmin, updateRequestStatus);
router.delete("/:id", verifyToken, requireAdmin, deleteSupportRequest);

module.exports = router;
