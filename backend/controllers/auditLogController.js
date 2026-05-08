const db = require("../data/db");

exports.getAuditLogs = (req, res) => {
  db.all(
    `SELECT l.*, a.name AS admin_name
     FROM audit_logs l
     LEFT JOIN admins a ON l.admin_id = a.admin_id
     ORDER BY l.date_created DESC
     LIMIT 300`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Failed to fetch audit logs" });
      res.json(rows);
    }
  );
};
