const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const dataDir = __dirname;
const dbPath = process.env.SQLITE_DB_PATH || path.join(dataDir, "pwdconnect.db");
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

function ensureColumn(table, column, definition) {
  db.all(`PRAGMA table_info(${table})`, [], (err, rows) => {
    if (err || !rows) return;
    if (!rows.some((row) => row.name === column)) {
      db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  });
}

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      disability_type TEXT NOT NULL,
      contact_info TEXT NOT NULL,
      address TEXT,
      email TEXT,
      email_verified INTEGER DEFAULT 1,
      email_verification_code_hash TEXT,
      email_verification_expires_at TEXT,
      two_factor_enabled INTEGER DEFAULT 0,
      two_factor_secret TEXT,
      two_factor_pending_secret TEXT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pending_registrations (
      pending_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      disability_type TEXT NOT NULL,
      contact_info TEXT NOT NULL,
      address TEXT,
      email TEXT NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      verification_code_hash TEXT NOT NULL,
      verification_expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      service_id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_name TEXT NOT NULL,
      description TEXT NOT NULL,
      provider TEXT NOT NULL,
      eligibility TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      app_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      admin_id INTEGER,
      status TEXT DEFAULT 'Pending',
      remarks TEXT,
      date_applied TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      voucher_code TEXT,
      qr_code_url TEXT,
      assistance_confirmation TEXT,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
      FOREIGN KEY (admin_id) REFERENCES admins(admin_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS requirements (
      requirement_id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      valid_id TEXT,
      pwd_id TEXT,
      medical_certificate TEXT,
      other_document TEXT,
      status TEXT DEFAULT 'Requirements Submitted',
      remarks TEXT,
      date_submitted TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(app_id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS vouchers (
      voucher_id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      voucher_code TEXT UNIQUE NOT NULL,
      qr_code TEXT NOT NULL,
      status TEXT DEFAULT 'Active',
      date_generated TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(app_id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS announcements (
      announcement_id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      date_posted TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES admins(admin_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS support_requests (
      request_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      service_id INTEGER,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      admin_reply TEXT,
      date_submitted TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER,
      action TEXT NOT NULL,
      target_table TEXT,
      target_id INTEGER,
      description TEXT,
      date_created TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES admins(admin_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS application_documents (
      doc_id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_url TEXT NOT NULL,
      field_name TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(app_id) ON DELETE CASCADE
    )
  `);

  [
    ["users", "created_at", "TEXT"],
    ["users", "email", "TEXT"],
    ["users", "email_verified", "INTEGER DEFAULT 1"],
    ["users", "email_verification_code_hash", "TEXT"],
    ["users", "email_verification_expires_at", "TEXT"],
    ["users", "two_factor_enabled", "INTEGER DEFAULT 0"],
    ["users", "two_factor_secret", "TEXT"],
    ["users", "two_factor_pending_secret", "TEXT"],
    ["admins", "created_at", "TEXT"],
    ["services", "created_at", "TEXT"],
    ["applications", "remarks", "TEXT"],
    ["applications", "updated_at", "TEXT"],
    ["applications", "voucher_code", "TEXT"],
    ["applications", "qr_code_url", "TEXT"],
    ["applications", "assistance_confirmation", "TEXT"],
    ["announcements", "updated_at", "TEXT"],
    ["support_requests", "admin_reply", "TEXT"],
    ["support_requests", "updated_at", "TEXT"]
  ].forEach(([table, column, definition]) => ensureColumn(table, column, definition));

  db.run("UPDATE applications SET status = 'Pending' WHERE status = 'Pending Approval'");
  db.run("UPDATE applications SET status = 'Approved' WHERE status = 'Approved - Requirements Needed'");
  db.run("UPDATE applications SET status = 'Voucher Generated' WHERE status = 'Requirement Verified'");
  db.run(`
    INSERT OR IGNORE INTO vouchers (app_id, user_id, service_id, voucher_code, qr_code, status, date_generated, updated_at)
    SELECT app_id, user_id, service_id, voucher_code, qr_code_url, 'Active',
      COALESCE(updated_at, date_applied, CURRENT_TIMESTAMP),
      COALESCE(updated_at, CURRENT_TIMESTAMP)
    FROM applications
    WHERE voucher_code IS NOT NULL
      AND qr_code_url IS NOT NULL
      AND app_id NOT IN (SELECT app_id FROM vouchers)
  `);

  db.get("SELECT * FROM admins WHERE username = ?", ["admin"], async (err, row) => {
    if (!row) {
      const hashedPassword = await bcrypt.hash("admin12345", 10);
      db.run(
        "INSERT INTO admins (name, username, password, role) VALUES (?, ?, ?, ?)",
        ["System Administrator", "admin", hashedPassword, "admin"],
        function(err) {
          if (err) {
            console.error("Error inserting admin:", err);
            return;
          }
          const adminId = this.lastID;
          // Insert announcements after admin is created
          db.get("SELECT COUNT(*) AS count FROM announcements", [], (err, row) => {
            if (row && row.count === 0) {
              const announcements = [
                ["New Wheelchair Grant Program", "New wheelchair assistance program is now available. Eligible users may apply through Browse Services."],
                ["System Maintenance Scheduled", "The portal may be temporarily unavailable during scheduled maintenance."],
                ["Updated Application Guidelines", "Please review the updated guidelines before submitting a service application."]
              ];

              announcements.forEach((announcement) => {
                db.run(
                  "INSERT INTO announcements (admin_id, title, content) VALUES (?, ?, ?)",
                  [adminId, announcement[0], announcement[1]]
                );
              });
            }
          });
        }
      );
    }
  });

  db.get("SELECT COUNT(*) AS count FROM services", [], (err, row) => {
    if (row && row.count === 0) {
      const services = [
        ["Wheelchair Assistance Program", "Provides wheelchair support and mobility assistance for eligible PWD members.", "DSWD / LGU", "Registered PWD with valid PWD ID", "Mobility"],
        ["Medical Support Services", "Healthcare-related support and medical assistance request program.", "DOH / Partner Clinics", "PWD users needing medical assistance", "Healthcare"],
        ["Education Grant Program", "Scholarship and educational support program for PWD students.", "DepEd / CHED / NGO Partners", "PWD students with school requirements", "Education"],
        ["Transport Subsidy", "Transportation discount and subsidy assistance for eligible PWDs.", "LGU / Transport Office", "Registered PWD commuters", "Transportation"],
        ["Job Training & Employment", "Skills training and job matching support for PWD job seekers.", "DOLE / TESDA", "PWD users seeking livelihood or employment", "Employment"],
        ["Housing Assistance", "Support for accessible housing modifications and housing-related needs.", "NHA / LGU", "PWD users needing accessible housing support", "Housing"]
      ];

      services.forEach((service) => {
        db.run(
          "INSERT INTO services (service_name, description, provider, eligibility, category) VALUES (?, ?, ?, ?, ?)",
          service
        );
      });
    }
  });


});

module.exports = db;
