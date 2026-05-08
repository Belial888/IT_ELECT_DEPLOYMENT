const db = require("../data/db");
const logAudit = require("../utils/auditLog");

const VALID_VOUCHER_STATUSES = ["Active", "Used", "Expired", "Cancelled"];

function voucherSelect(whereClause = "", params = []) {
  return {
    sql: `SELECT v.*, u.name AS user_name, s.service_name, a.status AS application_status
          FROM vouchers v
          JOIN users u ON v.user_id = u.user_id
          JOIN services s ON v.service_id = s.service_id
          JOIN applications a ON v.app_id = a.app_id
          ${whereClause}
          ORDER BY v.date_generated DESC`,
    params
  };
}

exports.getMyVouchers = (req, res) => {
  const query = voucherSelect("WHERE v.user_id = ?", [req.user.id]);
  db.all(query.sql, query.params, (err, rows) => {
    if (err) return res.status(500).json({ message: "Failed to fetch vouchers" });
    res.json(rows);
  });
};

exports.getAllVouchers = (req, res) => {
  const query = voucherSelect();
  db.all(query.sql, query.params, (err, rows) => {
    if (err) return res.status(500).json({ message: "Failed to fetch vouchers" });
    res.json(rows);
  });
};

exports.getVoucherById = (req, res) => {
  const query = voucherSelect("WHERE v.voucher_id = ?", [req.params.id]);
  db.get(query.sql, query.params, (err, row) => {
    if (err) return res.status(500).json({ message: "Failed to fetch voucher" });
    if (!row) return res.status(404).json({ message: "Voucher not found" });
    if (req.user.role !== "admin" && row.user_id !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view this voucher" });
    }
    res.json(row);
  });
};

exports.updateVoucherStatus = (req, res) => {
  const { status } = req.body;
  if (!VALID_VOUCHER_STATUSES.includes(status)) {
    return res.status(400).json({ message: "Invalid voucher status" });
  }

  db.run(
    "UPDATE vouchers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE voucher_id = ?",
    [status, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to update voucher" });
      if (this.changes === 0) return res.status(404).json({ message: "Voucher not found" });
      logAudit(req.user.id, "UPDATE_VOUCHER", "vouchers", req.params.id, `Set voucher #${req.params.id} to ${status}`);
      res.json({ message: "Voucher status updated", status });
    }
  );
};

exports.deleteVoucher = (req, res) => {
  db.run("DELETE FROM vouchers WHERE voucher_id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: "Failed to delete voucher" });
    if (this.changes === 0) return res.status(404).json({ message: "Voucher not found" });
    logAudit(req.user.id, "DELETE_VOUCHER", "vouchers", req.params.id, `Deleted voucher #${req.params.id}`);
    res.json({ message: "Voucher deleted" });
  });
};
