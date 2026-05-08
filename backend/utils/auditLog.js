const db = require("../data/db");

function logAudit(adminId, action, targetTable, targetId, description) {
  db.run(
    `INSERT INTO audit_logs (admin_id, action, target_table, target_id, description)
     VALUES (?, ?, ?, ?, ?)`,
    [adminId || null, action, targetTable || null, targetId || null, description || ""]
  );
}

module.exports = logAudit;
