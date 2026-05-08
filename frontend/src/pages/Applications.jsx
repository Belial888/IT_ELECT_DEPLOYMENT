import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import Icon from "../components/Icon";

const requirementFields = [
  { key: "valid_id", label: "Valid ID" },
  { key: "pwd_id", label: "PWD ID" },
  { key: "medical_certificate", label: "Medical Certificate" },
  { key: "other_document", label: "Other Supporting Document" }
];

const timeline = ["Pending", "Approved", "Requirements Submitted", "Requirements Verified", "Voucher Generated"];

const statusClass = (status = "") => status.toLowerCase().replace(/\s+/g, "-");

function escapeHtml(value = "") {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "";
}

function getVoucherText(app) {
  return [
    "PWDConnect PH Assistance Confirmation",
    "",
    `User: ${localStorage.getItem("name") || "PWD User"}`,
    `Application ID: ${app.app_id}`,
    `Service: ${app.service_name}`,
    `Provider: ${app.provider}`,
    `Voucher Code: ${app.voucher_code || ""}`,
    `Date Generated: ${formatDate(app.date_generated)}`,
    `Status: ${app.voucher_status || app.status}`,
    "",
    app.assistance_confirmation || "This voucher confirms approved assistance through PWDConnect PH."
  ].join("\n");
}

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [filesByApp, setFilesByApp] = useState({});
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);

  const requirementsByApp = useMemo(
    () => Object.fromEntries(requirements.map((requirement) => [requirement.app_id, requirement])),
    [requirements]
  );

  const vouchersByApp = useMemo(
    () => Object.fromEntries(vouchers.map((voucher) => [voucher.app_id, voucher])),
    [vouchers]
  );

  const load = async () => {
    setLoading(true);
    try {
      const [appsRes, reqRes, voucherRes] = await Promise.all([
        api.get("/applications/my"),
        api.get("/requirements/my"),
        api.get("/vouchers/my")
      ]);
      setApplications(appsRes.data);
      setRequirements(reqRes.data);
      setVouchers(voucherRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => setMessages({ page: "Failed to load applications." }));
  }, []);

  const updateFile = (appId, field, file) => {
    setFilesByApp((prev) => ({
      ...prev,
      [appId]: {
        ...(prev[appId] || {}),
        [field]: file
      }
    }));
  };

  const submitRequirements = async (appId, event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const selected = filesByApp[appId] || {};
    const missing = requirementFields.filter((field) => !selected[field.key]);

    if (missing.length > 0) {
      setMessages((prev) => ({ ...prev, [appId]: `Please upload: ${missing.map((field) => field.label).join(", ")}` }));
      return;
    }

    const formData = new FormData();
    formData.append("app_id", appId);
    requirementFields.forEach((field) => formData.append(field.key, selected[field.key]));

    try {
      await api.post("/requirements", formData);
      setMessages((prev) => ({ ...prev, [appId]: "Requirements submitted. Please wait for admin verification." }));
      setFilesByApp((prev) => ({ ...prev, [appId]: {} }));
      form.reset();
      await load();
    } catch (err) {
      setMessages((prev) => ({ ...prev, [appId]: err.response?.data?.message || "Failed to submit requirements." }));
    }
  };

  const printVoucher = (app, voucher) => {
    const printableVoucher = {
      voucher_code: voucher?.voucher_code || app.voucher_code || "",
      qr_code: voucher?.qr_code || app.qr_code || app.qr_code_url || "",
      status: voucher?.status || app.voucher_status || "Active",
      date_generated: voucher?.date_generated || app.date_generated
    };

    if (!printableVoucher.voucher_code || !printableVoucher.qr_code) {
      setMessages((prev) => ({ ...prev, [app.app_id]: "Voucher is not ready to print yet." }));
      return;
    }

    const printWindow = window.open("", "_blank", "width=760,height=900");
    if (!printWindow) {
      setMessages((prev) => ({ ...prev, [app.app_id]: "Please allow popups to print the voucher." }));
      return;
    }

    const voucherCode = escapeHtml(printableVoucher.voucher_code);
    const userName = escapeHtml(localStorage.getItem("name") || "PWD User");
    const serviceName = escapeHtml(app.service_name);
    const appId = escapeHtml(app.app_id);
    const status = escapeHtml(printableVoucher.status);
    const dateGenerated = escapeHtml(formatDate(printableVoucher.date_generated));
    const qrCode = escapeHtml(printableVoucher.qr_code);

    printWindow.document.write(`
      <html>
        <head>
          <title>${voucherCode}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #162033; }
            .voucher { border: 1px solid #cbd5e1; border-radius: 8px; padding: 28px; max-width: 640px; margin: 0 auto; }
            h1 { margin-top: 0; }
            img { width: 180px; height: 180px; object-fit: contain; }
            .code { font-size: 28px; font-weight: 800; letter-spacing: 1px; }
            @media print { body { padding: 0; } .voucher { border-color: #94a3b8; } }
          </style>
        </head>
        <body>
          <div class="voucher">
            <h1>PWDConnect PH</h1>
            <p>Assistance Confirmation</p>
            <p class="code">${voucherCode}</p>
            <p><strong>User:</strong> ${userName}</p>
            <p><strong>Service:</strong> ${serviceName}</p>
            <p><strong>Application ID:</strong> ${appId}</p>
            <p><strong>Status:</strong> ${status}</p>
            <p><strong>Date Generated:</strong> ${dateGenerated}</p>
            <img id="voucherQr" src="${qrCode}" alt="QR Code" />
          </div>
          <script>
            const printVoucher = () => {
              window.focus();
              setTimeout(() => window.print(), 150);
            };
            const qr = document.getElementById("voucherQr");
            if (qr && !qr.complete) {
              qr.addEventListener("load", printVoucher, { once: true });
              qr.addEventListener("error", printVoucher, { once: true });
              setTimeout(printVoucher, 1200);
            } else {
              printVoucher();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Layout title="My Applications" subtitle="Track applications, submit requirements, and download approved vouchers.">
      {messages.page && <div className="alert error">{messages.page}</div>}
      <div className="panel">
        <div className="sectionHeader">
          <div>
            <h2>Application History</h2>
            <p>Approved applications will show the requirement upload form.</p>
          </div>
        </div>

        {loading && <div className="emptyState">Loading applications...</div>}
        {!loading && applications.length === 0 && <div className="emptyState">No applications yet.</div>}

        <div className="list">
          {applications.map((app) => {
            const requirement = requirementsByApp[app.app_id];
            const voucher = vouchersByApp[app.app_id] || (app.qr_code ? app : null);
            const currentIndex = timeline.indexOf(app.status);
            const voucherCode = voucher?.voucher_code || app.voucher_code;
            const qrCode = voucher?.qr_code || app.qr_code || app.qr_code_url;

            return (
              <article className="listItem applicationItem" key={app.app_id}>
                <div className="itemMain">
                  <h3>{app.service_name}</h3>
                  <p>Provider: {app.provider}</p>
                  <small>Applied: {new Date(app.date_applied).toLocaleString()}</small>
                  {app.remarks && <p><strong>Remarks:</strong> {app.remarks}</p>}
                  {requirement?.remarks && <p><strong>Requirement remarks:</strong> {requirement.remarks}</p>}
                </div>

                <div className="actions">
                  <span className={`status ${statusClass(app.status)}`}>{app.status}</span>
                </div>

                <div className="statusTimeline" aria-label="Application status timeline">
                  {timeline.map((step, index) => (
                    <div
                      className={`timelineStep ${index <= currentIndex ? "done" : ""} ${app.status === "Rejected" ? "muted" : ""}`}
                      key={step}
                    >
                      <span>{index + 1}</span>
                      <strong>{step}</strong>
                    </div>
                  ))}
                  {app.status === "Rejected" && <div className="timelineRejected">Rejected</div>}
                </div>

                {app.status === "Approved" && (
                  <form className="requirementForm" onSubmit={(event) => submitRequirements(app.app_id, event)}>
                    <h4>Upload Requirements</h4>
                    <div className="formGrid">
                      {requirementFields.map((field) => (
                        <label className="fileInput" key={field.key}>
                          <span>{field.label}</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(event) => updateFile(app.app_id, field.key, event.target.files[0])}
                          />
                        </label>
                      ))}
                    </div>
                    <button className="primaryBtn" type="submit"><Icon name="send" />Submit Requirements</button>
                    {messages[app.app_id] && <div className="alert">{messages[app.app_id]}</div>}
                  </form>
                )}

                {requirement && app.status !== "Approved" && (
                  <div className="documentList">
                    <h4>Submitted Requirements</h4>
                    {requirementFields.map((field) => (
                      requirement[field.key] ? (
                        <div className="documentRow" key={field.key}>
                          <strong>{field.label}</strong>
                          <a href={requirement[field.key]} target="_blank" rel="noreferrer"><Icon name="download" />Open</a>
                        </div>
                      ) : null
                    ))}
                  </div>
                )}

                {voucherCode && qrCode && (
                  <div className="voucherCard">
                    <div>
                      <h4>PWDConnect PH Voucher</h4>
                      <p className="voucherCode">{voucherCode}</p>
                      <p><strong>Service:</strong> {app.service_name}</p>
                      <p><strong>Status:</strong> {voucher?.status || app.voucher_status || "Active"}</p>
                      {voucher?.date_generated && <p><strong>Date Generated:</strong> {new Date(voucher.date_generated).toLocaleString()}</p>}
                      <div className="actions leftActions">
                        <button type="button" onClick={() => printVoucher(app, voucher)}><Icon name="file" />Print</button>
                        <a className="buttonLink" href={`data:text/plain;charset=utf-8,${encodeURIComponent(getVoucherText({ ...app, ...voucher }))}`} download={`voucher-${voucherCode}.txt`}>
                          <Icon name="download" />Download Voucher
                        </a>
                        <a className="buttonLink secondaryBtn" href={qrCode} download={`qr-${voucherCode}.png`}>
                          <Icon name="voucher" />Download QR
                        </a>
                      </div>
                    </div>
                    <img src={qrCode} alt={`QR code for ${voucherCode}`} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
