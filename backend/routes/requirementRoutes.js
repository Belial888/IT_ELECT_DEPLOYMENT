const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  submitRequirements,
  getMyRequirements,
  getAllRequirements,
  verifyRequirements,
  rejectRequirements,
  deleteRequirements
} = require("../controllers/requirementController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

const uploadDir = path.join(__dirname, "../data/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ storage });
const router = express.Router();

router.post(
  "/",
  verifyToken,
  upload.fields([
    { name: "valid_id", maxCount: 1 },
    { name: "pwd_id", maxCount: 1 },
    { name: "medical_certificate", maxCount: 1 },
    { name: "other_document", maxCount: 1 }
  ]),
  submitRequirements
);
router.get("/my", verifyToken, getMyRequirements);
router.get("/", verifyToken, requireAdmin, getAllRequirements);
router.put("/:id/verify", verifyToken, requireAdmin, verifyRequirements);
router.put("/:id/reject", verifyToken, requireAdmin, rejectRequirements);
router.delete("/:id", verifyToken, requireAdmin, deleteRequirements);

module.exports = router;
