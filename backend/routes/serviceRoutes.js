const express = require("express");
const {
  getServices,
  createService,
  updateService,
  deleteService
} = require("../controllers/serviceController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", verifyToken, getServices);
router.post("/", verifyToken, requireAdmin, createService);
router.put("/:id", verifyToken, requireAdmin, updateService);
router.delete("/:id", verifyToken, requireAdmin, deleteService);

module.exports = router;
