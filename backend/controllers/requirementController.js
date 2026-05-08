const db = require("../data/db");
const logAudit = require("../utils/auditLog");
const { generateVoucherForApplication } = require("../utils/voucher");

const REQUIRED_FIELDS = ["valid_id", "pwd_id", "medical_certificate", "other_document"];

function uploadValue(req, fieldName) {
  const uploaded = req.files?.[fieldName]?.[0];
  if (uploaded) return `${req.protocol}://${req.get("host")}/uploads/${uploaded.filename}`;
  return req.body[fieldName] || "";
}

function getRequirementById(requirementId, callback) {
  db.get(
    `SELECT r.*, a.service_id, a.status AS application_status, u.name AS user_name, s.service_name
     FROM requirements r
     JOIN applications a ON r.app_id = a.app_id
     JOIN users u ON r.user_id = u.user_id
     JOIN services s ON a.service_id = s.service_id
     WHERE r.requirement_id = ?`,
    [requirementId],
    callback
  );
}

exports.submitRequirements = (req, res) => {
  const { app_id } = req.body;
  if (!app_id) return res.status(400).json({ message: "Application ID is required" });

  db.get("SELECT * FROM applications WHERE app_id = ?", [app_id], (err, application) => {
    if (err) return res.status(500).json({ message: "Failed to fetch application" });
    if (!application) return res.status(404).json({ message: "Application not found" });
    if (application.user_id !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to submit requirements for this application" });
    }
    if (application.status !== "Approved" && application.status !== "Requirements Submitted") {
      return res.status(400).json({ message: "Requirements can only be submitted after admin approval" });
    }

    const values = {
      valid_id: uploadValue(req, "valid_id"),
      pwd_id: uploadValue(req, "pwd_id"),
      medical_certificate: uploadValue(req, "medical_certificate"),
      other_document: uploadValue(req, "other_document")
    };

    const missing = REQUIRED_FIELDS.filter((field) => !values[field]);
    if (missing.length > 0) {
      return res.status(400).json({ message: `Missing required files: ${missing.join(", ")}` });
    }

    db.get("SELECT * FROM requirements WHERE app_id = ?", [app_id], (findErr, existing) => {
      if (findErr) return res.status(500).json({ message: "Failed to check requirements" });

      const finish = (requirementId) => {
        db.run(
          "UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE app_id = ?",
          ["Requirements Submitted", app_id],
          (updateErr) => {
            if (updateErr) return res.status(500).json({ message: "Failed to update application status" });
            res.status(existing ? 200 : 201).json({
              message: "Requirements submitted",
              requirement_id: requirementId,
              status: "Requirements Submitted"
            });
          }
        );
      };

      if (existing) {
        db.run(
          `UPDATE requirements
           SET valid_id = ?, pwd_id = ?, medical_certificate = ?, other_document = ?,
               status = ?, remarks = NULL, updated_at = CURRENT_TIMESTAMP
           WHERE requirement_id = ?`,
          [values.valid_id, values.pwd_id, values.medical_certificate, values.other_document, "Requirements Submitted", existing.requirement_id],
          (updateErr) => {
            if (updateErr) return res.status(500).json({ message: "Failed to update requirements" });
            finish(existing.requirement_id);
          }
        );
        return;
      }

      db.run(
        `INSERT INTO requirements (app_id, user_id, valid_id, pwd_id, medical_certificate, other_document, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [app_id, req.user.id, values.valid_id, values.pwd_id, values.medical_certificate, values.other_document, "Requirements Submitted"],
        function (insertErr) {
          if (insertErr) return res.status(500).json({ message: "Failed to save requirements" });
          finish(this.lastID);
        }
      );
    });
  });
};

exports.getMyRequirements = (req, res) => {
  db.all(
    `SELECT r.*, s.service_name, a.status AS application_status
     FROM requirements r
     JOIN applications a ON r.app_id = a.app_id
     JOIN services s ON a.service_id = s.service_id
     WHERE r.user_id = ?
     ORDER BY r.date_submitted DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Failed to fetch requirements" });
      res.json(rows);
    }
  );
};

exports.getAllRequirements = (req, res) => {
  db.all(
    `SELECT r.*, u.name AS user_name, s.service_name, a.status AS application_status
     FROM requirements r
     JOIN users u ON r.user_id = u.user_id
     JOIN applications a ON r.app_id = a.app_id
     JOIN services s ON a.service_id = s.service_id
     ORDER BY r.date_submitted DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Failed to fetch requirements" });
      res.json(rows);
    }
  );
};

exports.verifyRequirements = (req, res) => {
  const remarks = req.body.remarks || "Requirements verified";

  getRequirementById(req.params.id, (err, requirement) => {
    if (err) return res.status(500).json({ message: "Failed to fetch requirements" });
    if (!requirement) return res.status(404).json({ message: "Requirements not found" });

    db.run(
      `UPDATE requirements SET status = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP WHERE requirement_id = ?`,
      ["Requirements Verified", remarks, req.params.id],
      (updateReqErr) => {
        if (updateReqErr) return res.status(500).json({ message: "Failed to verify requirements" });

        db.run(
          `UPDATE applications SET status = ?, admin_id = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP WHERE app_id = ?`,
          ["Requirements Verified", req.user.id, remarks, requirement.app_id],
          (updateAppErr) => {
            if (updateAppErr) return res.status(500).json({ message: "Failed to update application" });

            generateVoucherForApplication(requirement.app_id, (voucherErr, voucher) => {
              if (voucherErr) return res.status(500).json({ message: "Failed to generate voucher" });
              logAudit(req.user.id, "VERIFY_REQUIREMENTS", "requirements", req.params.id, `Verified requirements for ${requirement.user_name}`);
              res.json({ message: "Requirements verified and voucher generated", voucher });
            });
          }
        );
      }
    );
  });
};

exports.rejectRequirements = (req, res) => {
  const remarks = req.body.remarks || "Requirements need correction";

  getRequirementById(req.params.id, (err, requirement) => {
    if (err) return res.status(500).json({ message: "Failed to fetch requirements" });
    if (!requirement) return res.status(404).json({ message: "Requirements not found" });

    db.run(
      `UPDATE requirements SET status = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP WHERE requirement_id = ?`,
      ["Rejected", remarks, req.params.id],
      (updateReqErr) => {
        if (updateReqErr) return res.status(500).json({ message: "Failed to reject requirements" });

        db.run(
          `UPDATE applications SET status = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP WHERE app_id = ?`,
          ["Approved", remarks, requirement.app_id],
          (updateAppErr) => {
            if (updateAppErr) return res.status(500).json({ message: "Failed to update application" });
            logAudit(req.user.id, "REJECT_REQUIREMENTS", "requirements", req.params.id, `Rejected requirements for ${requirement.user_name}`);
            res.json({ message: "Requirements rejected", status: "Rejected" });
          }
        );
      }
    );
  });
};

exports.deleteRequirements = (req, res) => {
  db.run("DELETE FROM requirements WHERE requirement_id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: "Failed to delete requirements" });
    if (this.changes === 0) return res.status(404).json({ message: "Requirements not found" });
    logAudit(req.user.id, "DELETE_REQUIREMENTS", "requirements", req.params.id, `Deleted requirement record #${req.params.id}`);
    res.json({ message: "Requirements deleted" });
  });
};
