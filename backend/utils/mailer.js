const nodemailer = require("nodemailer");

function getTransportConfig() {
  const user = process.env.GMAIL_USER || process.env.SMTP_USER;
  const rawPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !rawPass) return null;

  const service = process.env.SMTP_SERVICE || "gmail";
  const pass = service.toLowerCase() === "gmail"
    ? rawPass.replace(/\s+/g, "")
    : rawPass;

  return {
    service,
    auth: { user, pass }
  };
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

async function sendVerificationEmail({ to, name, code }) {
  const transportConfig = getTransportConfig();

  if (!transportConfig) {
    console.warn(`Email verification code for ${to}: ${code}`);
    return { sent: false, reason: "Email sender is not configured" };
  }

  const transporter = nodemailer.createTransport(transportConfig);
  const from = process.env.MAIL_FROM || transportConfig.auth.user;

  const safeName = escapeHtml(name);

  await transporter.sendMail({
    from,
    to,
    subject: "PWDConnect PH verification code",
    text: `Hello ${name},\n\nYour PWDConnect PH verification code is ${code}. It expires in 15 minutes.\n\nIf you did not create this account, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#162033;line-height:1.5">
        <h2>PWDConnect PH verification</h2>
        <p>Hello ${safeName},</p>
        <p>Your verification code is:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
        <p>This code expires in 15 minutes.</p>
        <p>If you did not create this account, you can ignore this email.</p>
      </div>
    `
  });

  return { sent: true };
}

module.exports = { sendVerificationEmail };
