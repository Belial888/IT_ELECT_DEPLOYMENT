const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const db = require("../data/db");
const { sendVerificationEmail } = require("../utils/mailer");
const { buildOtpAuthUrl, generateBase32Secret, verifyTotp } = require("../utils/totp");

const JWT_SECRET = process.env.JWT_SECRET || "PWDConnectPH_2026_x7Kp92LmQ4vTzPrivateSecret";
const VERIFICATION_MINUTES = 15;

function createToken(payload, expiresIn = "8h") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function createVerificationCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashCode(code, email) {
  return crypto
    .createHash("sha256")
    .update(`${String(code).trim()}:${String(email).trim().toLowerCase()}:${JWT_SECRET}`)
    .digest("hex");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getUserByUsernameOrEmail(username, email) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT user_id FROM users WHERE username = ? OR email = ?",
      [username, email],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

function getPendingByUsernameOrEmail(username, email) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT pending_id FROM pending_registrations WHERE username = ? OR email = ?",
      [username, email],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

function sendLoginResponse(res, account, idField) {
  const token = createToken({
    id: account[idField],
    username: account.username,
    role: account.role
  });

  res.json({
    message: "Login successful",
    token,
    user: {
      id: account[idField],
      name: account.name,
      username: account.username,
      role: account.role,
      email: account.email,
      email_verified: Boolean(account.email_verified),
      two_factor_enabled: Boolean(account.two_factor_enabled)
    }
  });
}

function storeVerificationCode(userId, email, code, callback) {
  const expiresAt = new Date(Date.now() + VERIFICATION_MINUTES * 60 * 1000).toISOString();
  db.run(
    `UPDATE users
     SET email_verification_code_hash = ?, email_verification_expires_at = ?
     WHERE user_id = ?`,
    [hashCode(code, email), expiresAt, userId],
    callback
  );
}

function devCodePayload(code) {
  if (process.env.NODE_ENV === "production") return {};
  return { devVerificationCode: code };
}

exports.register = async (req, res) => {
  try {
    const { name, disability_type, contact_info, address, username, password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!name || !disability_type || !contact_info || !email || !username || !password) {
      return res.status(400).json({ message: "Please complete all required fields" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    const existing = await getUserByUsernameOrEmail(username, email);
    if (existing) {
      return res.status(400).json({ message: "Username or email already exists" });
    }

    const pending = await getPendingByUsernameOrEmail(username, email);
    if (pending) {
      return res.status(400).json({ message: "This username or email is already waiting for verification. Please verify or resend the code." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = createVerificationCode();

    db.run(
      `INSERT INTO pending_registrations (
         name, disability_type, contact_info, address, email, username, password,
         verification_code_hash, verification_expires_at, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        name,
        disability_type,
        contact_info,
        address || "",
        email,
        username,
        hashedPassword,
        hashCode(code, email),
        new Date(Date.now() + VERIFICATION_MINUTES * 60 * 1000).toISOString()
      ],
      async function (err) {
        if (err) {
          return res.status(400).json({ message: "Username or email already exists, or the data is invalid" });
        }

        try {
          const mail = await sendVerificationEmail({ to: email, name, code });
          res.status(201).json({
            message: mail.sent
              ? "Verification code sent. Enter it to create your account."
              : "Email sender is not configured, so the verification code was logged on the server. Enter it to create your account.",
            pending_id: this.lastID,
            username,
            email,
            requiresEmailVerification: true,
            emailSent: mail.sent,
            ...(!mail.sent ? devCodePayload(code) : {})
          });
        } catch (mailErr) {
          console.error("Verification email send failed:", mailErr.message);
          res.status(201).json({
            message: "The account is not created yet. The verification email could not be sent, so please resend the code.",
            pending_id: this.lastID,
            username,
            email,
            requiresEmailVerification: true,
            emailSent: false,
            ...devCodePayload(code)
          });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Server error during registration" });
  }
};

exports.verifyEmail = (req, res) => {
  const { username, code } = req.body;

  if (!username || !code) {
    return res.status(400).json({ message: "Username and verification code are required" });
  }

  db.get("SELECT * FROM pending_registrations WHERE username = ?", [username], (err, pending) => {
    if (err || !pending) return res.status(404).json({ message: "Pending registration not found. Please register again." });
    if (!pending.verification_code_hash || !pending.verification_expires_at) {
      return res.status(400).json({ message: "No active verification code. Please resend the code." });
    }
    if (new Date(pending.verification_expires_at).getTime() < Date.now()) {
      return res.status(400).json({ message: "Verification code expired. Please resend the code." });
    }

    const expected = Buffer.from(pending.verification_code_hash);
    const received = Buffer.from(hashCode(code, pending.email || ""));
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    db.run(
      `INSERT INTO users (name, disability_type, contact_info, address, email, username, password, role, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'user', 1)`,
      [
        pending.name,
        pending.disability_type,
        pending.contact_info,
        pending.address || "",
        pending.email,
        pending.username,
        pending.password
      ],
      function (insertErr) {
        if (insertErr) return res.status(400).json({ message: "Username or email already exists. Please sign in or use a different account." });

        db.run("DELETE FROM pending_registrations WHERE pending_id = ?", [pending.pending_id], (deleteErr) => {
          if (deleteErr) return res.status(500).json({ message: "Account created, but failed to clear pending registration" });
          res.json({ message: "Email verified. Your account has been created. You can now sign in.", user_id: this.lastID });
        });
      }
    );
  });
};

exports.resendVerification = (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ message: "Username is required" });

  db.get("SELECT * FROM pending_registrations WHERE username = ?", [username], (err, pending) => {
    if (err || !pending) return res.status(404).json({ message: "Pending registration not found. Please register again." });
    if (!pending.email) return res.status(400).json({ message: "This registration does not have an email address" });

    const code = createVerificationCode();
    db.run(
      `UPDATE pending_registrations
       SET verification_code_hash = ?, verification_expires_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE pending_id = ?`,
      [
        hashCode(code, pending.email),
        new Date(Date.now() + VERIFICATION_MINUTES * 60 * 1000).toISOString(),
        pending.pending_id
      ],
      async (updateErr) => {
      if (updateErr) return res.status(500).json({ message: "Failed to create verification code" });

      try {
        const mail = await sendVerificationEmail({ to: pending.email, name: pending.name, code });
        res.json({
          message: mail.sent
            ? "Verification code sent. Please check your Gmail."
            : "Email sender is not configured, so the verification code was logged on the server.",
          emailSent: mail.sent,
          ...(!mail.sent ? devCodePayload(code) : {})
        });
      } catch (mailErr) {
        console.error("Verification email resend failed:", mailErr.message);
        res.json({
          message: "Verification email could not be sent, so the development code is shown here.",
          emailSent: false,
          ...devCodePayload(code)
        });
      }
    });
  });
};

exports.login = (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: "Username, password, and role are required" });
  }

  const table = role === "admin" ? "admins" : "users";
  const idField = role === "admin" ? "admin_id" : "user_id";

  db.get(`SELECT * FROM ${table} WHERE username = ?`, [username], async (err, account) => {
    if (err) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!account && role !== "admin") {
      db.get("SELECT username, email FROM pending_registrations WHERE username = ?", [username], (pendingErr, pending) => {
        if (pendingErr || !pending) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        return res.status(403).json({
          message: "Please verify your Gmail code to create your account.",
          requiresEmailVerification: true,
          username: pending.username,
          email: pending.email
        });
      });
      return;
    }

    if (!account) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (role !== "admin" && !account.email_verified) {
      return res.status(403).json({
        message: "Please verify your Gmail code before signing in.",
        requiresEmailVerification: true,
        username: account.username,
        email: account.email
      });
    }

    if (role !== "admin" && account.two_factor_enabled) {
      return res.json({
        message: "Two-factor authentication required",
        requiresTwoFactor: true,
        twoFactorToken: createToken({ id: account[idField], role: account.role, type: "login_2fa" }, "5m")
      });
    }

    sendLoginResponse(res, account, idField);
  });
};

exports.completeTwoFactorLogin = (req, res) => {
  const { twoFactorToken, code } = req.body;

  if (!twoFactorToken || !code) {
    return res.status(400).json({ message: "Two-factor token and code are required" });
  }

  try {
    const pending = jwt.verify(twoFactorToken, JWT_SECRET);
    if (pending.type !== "login_2fa" || pending.role !== "user") {
      return res.status(401).json({ message: "Invalid two-factor login session" });
    }

    db.get("SELECT * FROM users WHERE user_id = ?", [pending.id], (err, account) => {
      if (err || !account || !account.two_factor_enabled || !account.two_factor_secret) {
        return res.status(401).json({ message: "Invalid two-factor login session" });
      }
      if (!verifyTotp(account.two_factor_secret, code)) {
        return res.status(401).json({ message: "Invalid authenticator code" });
      }

      sendLoginResponse(res, account, "user_id");
    });
  } catch (err) {
    res.status(401).json({ message: "Two-factor login session expired. Please sign in again." });
  }
};

exports.setupTwoFactor = (req, res) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Two-factor setup is available for user accounts" });
  }

  db.get("SELECT user_id, username, email, two_factor_enabled FROM users WHERE user_id = ?", [req.user.id], async (err, user) => {
    if (err || !user) return res.status(404).json({ message: "Account not found" });
    if (user.two_factor_enabled) return res.status(400).json({ message: "Two-factor authentication is already enabled" });

    const secret = generateBase32Secret();
    const otpAuthUrl = buildOtpAuthUrl({
      issuer: "PWDConnect PH",
      accountName: user.email || user.username,
      secret
    });

    db.run(
      "UPDATE users SET two_factor_pending_secret = ? WHERE user_id = ?",
      [secret, req.user.id],
      async (updateErr) => {
        if (updateErr) return res.status(500).json({ message: "Failed to start two-factor setup" });

        try {
          const qrCode = await QRCode.toDataURL(otpAuthUrl);
          res.json({ message: "Scan the QR code with your authenticator app", secret, otpauth_url: otpAuthUrl, qr_code: qrCode });
        } catch (qrErr) {
          res.status(500).json({ message: "Failed to generate QR code" });
        }
      }
    );
  });
};

exports.enableTwoFactor = (req, res) => {
  const { code } = req.body;

  db.get("SELECT two_factor_pending_secret FROM users WHERE user_id = ?", [req.user.id], (err, user) => {
    if (err || !user) return res.status(404).json({ message: "Account not found" });
    if (!user.two_factor_pending_secret) {
      return res.status(400).json({ message: "Please start two-factor setup first" });
    }
    if (!verifyTotp(user.two_factor_pending_secret, code)) {
      return res.status(400).json({ message: "Invalid authenticator code" });
    }

    db.run(
      `UPDATE users
       SET two_factor_enabled = 1, two_factor_secret = ?, two_factor_pending_secret = NULL
       WHERE user_id = ?`,
      [user.two_factor_pending_secret, req.user.id],
      (updateErr) => {
        if (updateErr) return res.status(500).json({ message: "Failed to enable two-factor authentication" });
        res.json({ message: "Two-factor authentication enabled" });
      }
    );
  });
};

exports.disableTwoFactor = (req, res) => {
  const { code } = req.body;

  db.get("SELECT two_factor_enabled, two_factor_secret FROM users WHERE user_id = ?", [req.user.id], (err, user) => {
    if (err || !user) return res.status(404).json({ message: "Account not found" });
    if (!user.two_factor_enabled) return res.json({ message: "Two-factor authentication is already disabled" });
    if (!verifyTotp(user.two_factor_secret, code)) {
      return res.status(400).json({ message: "Invalid authenticator code" });
    }

    db.run(
      `UPDATE users
       SET two_factor_enabled = 0, two_factor_secret = NULL, two_factor_pending_secret = NULL
       WHERE user_id = ?`,
      [req.user.id],
      (updateErr) => {
        if (updateErr) return res.status(500).json({ message: "Failed to disable two-factor authentication" });
        res.json({ message: "Two-factor authentication disabled" });
      }
    );
  });
};

exports.me = (req, res) => {
  const table = req.user.role === "admin" ? "admins" : "users";
  const idField = req.user.role === "admin" ? "admin_id" : "user_id";
  const fields = req.user.role === "admin"
    ? `${idField} AS id, name, username, role`
    : `${idField} AS id, name, username, email, email_verified, two_factor_enabled, role`;

  db.get(
    `SELECT ${fields} FROM ${table} WHERE ${idField} = ?`,
    [req.user.id],
    (err, row) => {
      if (err || !row) return res.status(404).json({ message: "Account not found" });
      res.json({
        ...row,
        email_verified: Boolean(row.email_verified),
        two_factor_enabled: Boolean(row.two_factor_enabled)
      });
    }
  );
};
