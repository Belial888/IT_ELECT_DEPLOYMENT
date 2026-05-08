require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");

const authRoutes = require("../routes/authRoutes");
const userRoutes = require("../routes/userRoutes");
const serviceRoutes = require("../routes/serviceRoutes");
const applicationRoutes = require("../routes/applicationRoutes");
const requirementRoutes = require("../routes/requirementRoutes");
const voucherRoutes = require("../routes/voucherRoutes");
const announcementRoutes = require("../routes/announcementRoutes");
const supportRoutes = require("../routes/supportRoutes");
const auditLogRoutes = require("../routes/auditLogRoutes");

const app = express();
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadsDir));
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "PWDConnect PH API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/requirements", requirementRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/audit-logs", auditLogRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`PWDConnect PH backend running on http://localhost:${PORT}`);
});
