const bcrypt = require("bcryptjs");
const db = require("../data/db");
const logAudit = require("../utils/auditLog");

exports.getProfile = (req, res) => {
  db.get(
    `SELECT user_id, name, disability_type, contact_info, address, username, email,
      email_verified, two_factor_enabled, role, created_at
     FROM users WHERE user_id = ?`,
    [req.user.id],
    (err, row) => {
      if (err || !row) return res.status(404).json({ message: "Profile not found" });
      res.json({
        ...row,
        email_verified: Boolean(row.email_verified),
        two_factor_enabled: Boolean(row.two_factor_enabled)
      });
    }
  );
};

exports.updateProfile = (req, res) => {
  const { name, disability_type, contact_info, address } = req.body;
  if (!name || !disability_type || !contact_info) {
    return res.status(400).json({ message: "Name, disability type, and contact info are required" });
  }

  db.run(
    "UPDATE users SET name = ?, disability_type = ?, contact_info = ?, address = ? WHERE user_id = ?",
    [name, disability_type, contact_info, address || "", req.user.id],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to update profile" });
      res.json({ message: "Profile updated successfully" });
    }
  );
};

exports.getAllUsers = (req, res) => {
  db.all(
    `SELECT u.user_id, u.name, u.disability_type, u.contact_info, u.address, u.username, u.email,
       u.email_verified, u.two_factor_enabled, u.role, u.created_at,
       COUNT(a.app_id) AS application_count
     FROM users u
     LEFT JOIN applications a ON a.user_id = u.user_id
     GROUP BY u.user_id
     ORDER BY u.user_id DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Failed to fetch users" });
      res.json(rows.map((row) => ({
        ...row,
        email_verified: Boolean(row.email_verified),
        two_factor_enabled: Boolean(row.two_factor_enabled)
      })));
    }
  );
};

exports.createUser = async (req, res) => {
  try {
    const { name, disability_type, contact_info, address, username, password } = req.body;
    if (!name || !disability_type || !contact_info || !username || !password) {
      return res.status(400).json({ message: "Please complete all required fields" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      `INSERT INTO users (name, disability_type, contact_info, address, username, password, role)
       VALUES (?, ?, ?, ?, ?, ?, 'user')`,
      [name, disability_type, contact_info, address || "", username, hashedPassword],
      function (err) {
        if (err) return res.status(400).json({ message: "Username already exists or invalid user data" });
        logAudit(req.user.id, "CREATE_USER", "users", this.lastID, `Created user ${username}`);
        res.status(201).json({ message: "User created", user_id: this.lastID });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Failed to create user" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, disability_type, contact_info, address, username, password } = req.body;
    if (!name || !disability_type || !contact_info || !username) {
      return res.status(400).json({ message: "Name, disability type, contact info, and username are required" });
    }

    const finish = (query, params) => {
      db.run(query, params, function (err) {
        if (err) return res.status(400).json({ message: "Failed to update user. Username may already exist." });
        if (this.changes === 0) return res.status(404).json({ message: "User not found" });
        logAudit(req.user.id, "UPDATE_USER", "users", req.params.id, `Updated user #${req.params.id}`);
        res.json({ message: "User updated" });
      });
    };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      finish(
        `UPDATE users SET name = ?, disability_type = ?, contact_info = ?, address = ?, username = ?, password = ?
         WHERE user_id = ?`,
        [name, disability_type, contact_info, address || "", username, hashedPassword, req.params.id]
      );
      return;
    }

    finish(
      `UPDATE users SET name = ?, disability_type = ?, contact_info = ?, address = ?, username = ?
       WHERE user_id = ?`,
      [name, disability_type, contact_info, address || "", username, req.params.id]
    );
  } catch (error) {
    res.status(500).json({ message: "Failed to update user" });
  }
};

exports.deleteUser = (req, res) => {
  const userId = req.params.id;
  db.serialize(() => {
    db.run("DELETE FROM vouchers WHERE user_id = ?", [userId]);
    db.run("DELETE FROM requirements WHERE user_id = ?", [userId]);
    db.run("DELETE FROM application_documents WHERE app_id IN (SELECT app_id FROM applications WHERE user_id = ?)", [userId]);
    db.run("DELETE FROM applications WHERE user_id = ?", [userId]);
    db.run("DELETE FROM support_requests WHERE user_id = ?", [userId]);
    db.run("DELETE FROM users WHERE user_id = ?", [userId], function (err) {
      if (err) return res.status(500).json({ message: "Failed to delete user" });
      if (this.changes === 0) return res.status(404).json({ message: "User not found" });
      logAudit(req.user.id, "DELETE_USER", "users", userId, `Deleted user #${userId}`);
      res.json({ message: "User deleted" });
    });
  });
};
