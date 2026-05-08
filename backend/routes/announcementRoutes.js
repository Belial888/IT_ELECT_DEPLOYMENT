const express = require("express");
const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require("../controllers/announcementController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", verifyToken, getAnnouncements);
router.post("/", verifyToken, requireAdmin, createAnnouncement);
router.put("/:id", verifyToken, requireAdmin, updateAnnouncement);
router.delete("/:id", verifyToken, requireAdmin, deleteAnnouncement);

module.exports = router;
