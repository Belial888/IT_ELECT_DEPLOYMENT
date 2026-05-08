const QRCode = require("qrcode");
const db = require("../data/db");

function nextVoucherCode(callback) {
  const year = new Date().getFullYear();
  db.get("SELECT COUNT(*) AS count FROM vouchers WHERE voucher_code LIKE ?", [`PWD-${year}-%`], (err, row) => {
    if (err) return callback(err);
    const sequence = String((row?.count || 0) + 1).padStart(4, "0");
    callback(null, `PWD-${year}-${sequence}`);
  });
}

function buildVoucherPayload(application, voucherCode, generatedAt) {
  return JSON.stringify({
    voucher_code: voucherCode,
    user_name: application.user_name,
    service_name: application.service_name,
    app_id: application.app_id,
    status: "Voucher Generated",
    date_generated: generatedAt
  });
}

function generateVoucherForApplication(appId, callback) {
  db.get(
    `SELECT a.*, u.name AS user_name, s.service_name
     FROM applications a
     JOIN users u ON a.user_id = u.user_id
     JOIN services s ON a.service_id = s.service_id
     WHERE a.app_id = ?`,
    [appId],
    (err, application) => {
      if (err) return callback(err);
      if (!application) return callback(null, null);

      db.get("SELECT * FROM vouchers WHERE app_id = ?", [appId], async (voucherErr, existingVoucher) => {
        if (voucherErr) return callback(voucherErr);
        if (existingVoucher) return callback(null, existingVoucher);

        nextVoucherCode(async (codeErr, voucherCode) => {
          if (codeErr) return callback(codeErr);

          const generatedAt = new Date().toISOString();
          let qrCode;
          try {
            qrCode = await QRCode.toDataURL(buildVoucherPayload(application, voucherCode, generatedAt));
          } catch (qrErr) {
            return callback(qrErr);
          }

          db.run(
            `INSERT INTO vouchers (app_id, user_id, service_id, voucher_code, qr_code, status, date_generated, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [application.app_id, application.user_id, application.service_id, voucherCode, qrCode, "Active", generatedAt, generatedAt],
            function (insertErr) {
              if (insertErr) return callback(insertErr);

              const confirmation = `Your requirements have been verified. Your assistance voucher ${voucherCode} is ready for use.`;
              db.run(
                `UPDATE applications
                 SET status = ?, voucher_code = ?, qr_code_url = ?, assistance_confirmation = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE app_id = ?`,
                ["Voucher Generated", voucherCode, qrCode, confirmation, appId],
                (updateErr) => {
                  if (updateErr) return callback(updateErr);
                  callback(null, {
                    voucher_id: this.lastID,
                    app_id: appId,
                    user_id: application.user_id,
                    service_id: application.service_id,
                    voucher_code: voucherCode,
                    qr_code: qrCode,
                    status: "Active",
                    date_generated: generatedAt
                  });
                }
              );
            }
          );
        });
      });
    }
  );
}

module.exports = { generateVoucherForApplication };
