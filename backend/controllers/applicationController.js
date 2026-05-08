const db = require("../data/db");
const logAudit = require("../utils/auditLog");
const { generateVoucherForApplication } = require("../utils/voucher");

const VALID_STATUSES = [
  "Pending",
  "Approved",
  "Requirements Submitted",
  "Requirements Verified",
  "Voucher Generated",
  "Rejected"
];

const LEGACY_DOCUMENT_TYPES = {
  "valid id": "valid_id",
  "pwd id": "pwd_id",
  "medical certificate": "medical_certificate",
  "barangay certificate": "other_document",
  "other supporting document": "other_document",
  "other document": "other_document"
};

function normalizeStatus(status) {
  if (status === "Pending Approval") return "Pending";
  if (status === "Approved - Requirements Needed") return "Approved";
  if (status === "Requirement Verified") return "Voucher Generated";
  return status;
}

function fileUrl(req, filename) {
  return `${req.protocol}://${req.get("host")}/uploads/${filename}`;
}

exports.applyForService = (req, res) => {
  const { service_id } = req.body;

  if (!service_id) return res.status(400).json({ message: "Service ID is required" });

  db.get("SELECT * FROM services WHERE service_id = ?", [service_id], (serviceErr, service) => {
    if (serviceErr) return res.status(500).json({ message: "Failed to check service" });
    if (!service) return res.status(404).json({ message: "Service not found" });

    db.get(
      `SELECT * FROM applications
       WHERE user_id = ? AND service_id = ? AND status != 'Rejected'`,
      [req.user.id, service_id],
      (err, existing) => {
        if (err) return res.status(500).json({ message: "Failed to check existing application" });
        if (existing) return res.status(400).json({ message: "You already have an active application for this service" });

        db.run(
          "INSERT INTO applications (user_id, service_id, status, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
          [req.user.id, service_id, "Pending"],
          function (insertErr) {
            if (insertErr) return res.status(500).json({ message: "Failed to submit application" });
            res.status(201).json({ message: "Application submitted", app_id: this.lastID, status: "Pending" });
          }
        );
      }
    );
  });
};

exports.getMyApplications = (req, res) => {
  db.all(
    `SELECT a.*, s.service_name, s.provider, s.category,
       r.requirement_id, r.status AS requirement_status, r.remarks AS requirement_remarks,
       v.voucher_id, v.voucher_code AS voucher_table_code, v.qr_code, v.status AS voucher_status, v.date_generated
     FROM applications a
     JOIN services s ON a.service_id = s.service_id
     LEFT JOIN requirements r ON r.app_id = a.app_id
     LEFT JOIN vouchers v ON v.app_id = a.app_id
     WHERE a.user_id = ?
     ORDER BY a.date_applied DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Failed to fetch applications" });
      res.json(rows.map((row) => ({ ...row, status: normalizeStatus(row.status), voucher_code: row.voucher_code || row.voucher_table_code })));
    }
  );
};

exports.getAllApplications = (req, res) => {
  db.all(
    `SELECT a.*, u.name AS user_name, u.disability_type, u.contact_info, s.service_name, s.provider, s.category,
       r.requirement_id, r.status AS requirement_status,
       v.voucher_id, v.voucher_code AS voucher_table_code, v.status AS voucher_status,
       (SELECT COUNT(*) FROM application_documents d WHERE d.app_id = a.app_id) AS document_count
     FROM applications a
     JOIN users u ON a.user_id = u.user_id
     JOIN services s ON a.service_id = s.service_id
     LEFT JOIN requirements r ON r.app_id = a.app_id
     LEFT JOIN vouchers v ON v.app_id = a.app_id
     ORDER BY a.date_applied DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Failed to fetch applications" });
      res.json(rows.map((row) => ({ ...row, status: normalizeStatus(row.status), voucher_code: row.voucher_code || row.voucher_table_code })));
    }
  );
};

exports.getApplicationById = (req, res) => {
  db.get(
    `SELECT a.*, u.name AS user_name, u.disability_type, s.service_name, s.provider, s.category,
       r.requirement_id, r.status AS requirement_status, r.remarks AS requirement_remarks,
       v.voucher_id, v.voucher_code AS voucher_table_code, v.qr_code, v.status AS voucher_status, v.date_generated
     FROM applications a
     JOIN users u ON a.user_id = u.user_id
     JOIN services s ON a.service_id = s.service_id
     LEFT JOIN requirements r ON r.app_id = a.app_id
     LEFT JOIN vouchers v ON v.app_id = a.app_id
     WHERE a.app_id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ message: "Failed to fetch application" });
      if (!row) return res.status(404).json({ message: "Application not found" });
      if (req.user.role !== "admin" && row.user_id !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to view this application" });
      }
      res.json({ ...row, status: normalizeStatus(row.status), voucher_code: row.voucher_code || row.voucher_table_code });
    }
  );
};

exports.updateApplicationStatus = (req, res) => {
  const status = normalizeStatus(req.body.status);
  const remarks = req.body.remarks || "";

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  db.get("SELECT * FROM applications WHERE app_id = ?", [req.params.id], (err, application) => {
    if (err) return res.status(500).json({ message: "Failed to fetch application" });
    if (!application) return res.status(404).json({ message: "Application not found" });

    const current = normalizeStatus(application.status);
    if (current === "Voucher Generated" && status !== "Voucher Generated") {
      return res.status(400).json({ message: "Voucher generated applications cannot be moved back" });
    }

    if (status === "Approved" && current !== "Pending") {
      return res.status(400).json({ message: "Only pending applications can be approved" });
    }

    if (status === "Requirements Verified" || status === "Voucher Generated") {
      db.get("SELECT * FROM requirements WHERE app_id = ?", [req.params.id], (reqErr, requirement) => {
        if (reqErr) return res.status(500).json({ message: "Failed to fetch requirements" });
        if (!requirement) return res.status(400).json({ message: "Requirements must be submitted before verification" });

        db.run(
          `UPDATE requirements SET status = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP WHERE requirement_id = ?`,
          ["Requirements Verified", remarks || requirement.remarks || "", requirement.requirement_id],
          (updateReqErr) => {
            if (updateReqErr) return res.status(500).json({ message: "Failed to verify requirements" });
            generateVoucherForApplication(req.params.id, (voucherErr, voucher) => {
              if (voucherErr) return res.status(500).json({ message: "Failed to generate voucher" });
              logAudit(req.user.id, "VERIFY_REQUIREMENTS", "applications", req.params.id, `Verified requirements for application #${req.params.id}`);
              res.json({ message: "Requirements verified and voucher generated", voucher });
            });
          }
        );
      });
      return;
    }

    db.run(
      `UPDATE applications
       SET status = ?, admin_id = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP
       WHERE app_id = ?`,
      [status, req.user.id, remarks, req.params.id],
      function (updateErr) {
        if (updateErr) return res.status(500).json({ message: "Failed to update application" });
        logAudit(req.user.id, "UPDATE_APPLICATION", "applications", req.params.id, `Set application #${req.params.id} to ${status}`);
        res.json({ message: "Application status updated", status });
      }
    );
  });
};

exports.deleteApplication = (req, res) => {
  const appId = req.params.id;
  db.serialize(() => {
    db.run("DELETE FROM vouchers WHERE app_id = ?", [appId]);
    db.run("DELETE FROM requirements WHERE app_id = ?", [appId]);
    db.run("DELETE FROM application_documents WHERE app_id = ?", [appId]);
    db.run("DELETE FROM applications WHERE app_id = ?", [appId], function (err) {
      if (err) return res.status(500).json({ message: "Failed to delete application" });
      if (this.changes === 0) return res.status(404).json({ message: "Application not found" });
      logAudit(req.user.id, "DELETE_APPLICATION", "applications", appId, `Deleted application #${appId}`);
      res.json({ message: "Application deleted" });
    });
  });
};

exports.uploadApplicationDocument = (req, res) => {
  const appId = req.params.id;
  const fieldName = req.body.field_name || "Other Supporting Document";

  if (!req.file) return res.status(400).json({ message: "Document file is required" });

  db.get("SELECT * FROM applications WHERE app_id = ?", [appId], (err, application) => {
    if (err || !application) return res.status(404).json({ message: "Application not found" });
    if (req.user.role !== "admin" && application.user_id !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to upload documents for this application" });
    }
    if (req.user.role !== "admin" && normalizeStatus(application.status) !== "Approved") {
      return res.status(400).json({ message: "Requirements can only be uploaded after admin approval" });
    }

    const uploadUrl = fileUrl(req, req.file.filename);
    db.run(
      "INSERT INTO application_documents (app_id, filename, file_path, file_url, field_name) VALUES (?, ?, ?, ?, ?)",
      [appId, req.file.originalname, req.file.filename, uploadUrl, fieldName],
      function (docErr) {
        if (docErr) return res.status(500).json({ message: "Failed to save document" });

        const requirementField = LEGACY_DOCUMENT_TYPES[String(fieldName).trim().toLowerCase()] || "other_document";
        const upsertSql = `
          INSERT INTO requirements (app_id, user_id, ${requirementField}, status, updated_at)
          VALUES (?, ?, ?, 'Requirements Submitted', CURRENT_TIMESTAMP)
          ON CONFLICT(requirement_id) DO NOTHING
        `;

        db.get("SELECT * FROM requirements WHERE app_id = ?", [appId], (getErr, requirement) => {
          if (getErr) return res.status(500).json({ message: "Failed to save requirement" });
          const finish = () => {
            db.run(
              "UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE app_id = ?",
              ["Requirements Submitted", appId],
              () => res.status(201).json({ message: "Document uploaded", doc_id: this.lastID, file_url: uploadUrl })
            );
          };

          if (requirement) {
            db.run(
              `UPDATE requirements SET ${requirementField} = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE requirement_id = ?`,
              [uploadUrl, "Requirements Submitted", requirement.requirement_id],
              finish
            );
            return;
          }

          db.run(upsertSql, [appId, application.user_id, uploadUrl], finish);
        });
      }
    );
  });
};

exports.getApplicationDocuments = (req, res) => {
  const appId = req.params.id;

  db.get("SELECT * FROM applications WHERE app_id = ?", [appId], (err, application) => {
    if (err || !application) return res.status(404).json({ message: "Application not found" });
    if (req.user.role !== "admin" && application.user_id !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view these documents" });
    }

    db.all(
      "SELECT doc_id, filename, file_url, field_name, status, uploaded_at FROM application_documents WHERE app_id = ? ORDER BY uploaded_at DESC",
      [appId],
      (docErr, rows) => {
        if (docErr) return res.status(500).json({ message: "Failed to fetch documents" });
        res.json(rows);
      }
    );
  });
};
