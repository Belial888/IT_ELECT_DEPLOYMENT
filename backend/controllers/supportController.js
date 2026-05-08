const db = require("../data/db");
const logAudit = require("../utils/auditLog");

exports.createSupportRequest = (req, res) => {
  const { service_id, subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ message: "Subject and message are required" });
  }

  db.run(
    "INSERT INTO support_requests (user_id, service_id, subject, message, status) VALUES (?, ?, ?, ?, ?)",
    [req.user.id, service_id || null, subject, message, "Pending"],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to submit request" });
      res.status(201).json({ message: "Support request submitted", request_id: this.lastID });
    }
  );
};

exports.getMyRequests = (req, res) => {
  db.all(
    `SELECT r.*, s.service_name
     FROM support_requests r
     LEFT JOIN services s ON r.service_id = s.service_id
     WHERE r.user_id = ?
     ORDER BY r.date_submitted DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Failed to fetch requests" });
      res.json(rows);
    }
  );
};

exports.getAllRequests = (req, res) => {
  db.all(
    `SELECT r.*, u.name AS user_name, s.service_name
     FROM support_requests r
     JOIN users u ON r.user_id = u.user_id
     LEFT JOIN services s ON r.service_id = s.service_id
     ORDER BY r.date_submitted DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Failed to fetch requests" });
      res.json(rows);
    }
  );
};

exports.updateRequestStatus = (req, res) => {
  const { status, admin_reply } = req.body;

  if (!["Pending", "In Progress", "Resolved"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  db.run(
    "UPDATE support_requests SET status = ?, admin_reply = ?, updated_at = CURRENT_TIMESTAMP WHERE request_id = ?",
    [status, admin_reply || "", req.params.id],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to update request" });
      if (this.changes === 0) return res.status(404).json({ message: "Support request not found" });
      logAudit(req.user.id, "UPDATE_SUPPORT_REQUEST", "support_requests", req.params.id, `Set support request #${req.params.id} to ${status}`);
      res.json({ message: "Request status updated" });
    }
  );
};

exports.deleteSupportRequest = (req, res) => {
  db.run("DELETE FROM support_requests WHERE request_id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: "Failed to delete request" });
    if (this.changes === 0) return res.status(404).json({ message: "Support request not found" });
    logAudit(req.user.id, "DELETE_SUPPORT_REQUEST", "support_requests", req.params.id, `Deleted support request #${req.params.id}`);
    res.json({ message: "Support request deleted" });
  });
};
