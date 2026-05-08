const express = require("express");
const {
  getMyVouchers,
  getAllVouchers,
  getVoucherById,
  updateVoucherStatus,
  deleteVoucher
} = require("../controllers/voucherController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/my", verifyToken, getMyVouchers);
router.get("/", verifyToken, requireAdmin, getAllVouchers);
router.get("/:id", verifyToken, getVoucherById);
router.put("/:id/status", verifyToken, requireAdmin, updateVoucherStatus);
router.delete("/:id", verifyToken, requireAdmin, deleteVoucher);

module.exports = router;
