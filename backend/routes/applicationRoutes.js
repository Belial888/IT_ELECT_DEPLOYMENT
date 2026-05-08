const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  applyForService,
  getMyApplications,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  uploadApplicationDocument,
  getApplicationDocuments
} = require("../controllers/applicationController");
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

router.post("/", verifyToken, applyForService);
router.get("/my", verifyToken, getMyApplications);
router.get("/", verifyToken, requireAdmin, getAllApplications);
router.get("/:id", verifyToken, getApplicationById);
router.put("/:id/status", verifyToken, requireAdmin, updateApplicationStatus);
router.delete("/:id", verifyToken, requireAdmin, deleteApplication);
router.post("/:id/documents", verifyToken, upload.single("document"), uploadApplicationDocument);
router.get("/:id/documents", verifyToken, getApplicationDocuments);

module.exports = router;
