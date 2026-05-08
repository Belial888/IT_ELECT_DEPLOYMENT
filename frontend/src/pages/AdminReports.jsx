import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import Icon from "../components/Icon";

const statusClass = (status = "") => status.toLowerCase().replace(/\s+/g, "-");

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function inRange(value, from, to) {
  const date = parseDate(value);
  if (!date) return true;
  if (from && date < new Date(`${from}T00:00:00`)) return false;
  if (to && date > new Date(`${to}T23:59:59`)) return false;
  return true;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function toCsv(rows) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escapeCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(","))].join("\n");
}

function toExcelTable(rows, title) {
  if (rows.length === 0) return `<table><tr><td>${title}</td></tr><tr><td>No records</td></tr></table>`;
  const headers = Object.keys(rows[0]);
  return `
    <table>
      <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${headers.map((header) => `<td>${row[header] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
  `;
}

function printReport(title, summaryRows, activityRows) {
  const printWindow = window.open("", "_blank", "width=980,height=900");
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #162033; padding: 28px; }
          h1 { margin: 0 0 8px; }
          p { color: #475569; }
          table { width: 100%; border-collapse: collapse; margin-top: 18px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #eef4fb; }
        </style>
      </head>
      <body>
        <h1>PWDConnect PH Reports</h1>
        <p>${new Date().toLocaleString()}</p>
        <h2>Summary Report</h2>
        ${toExcelTable(summaryRows, "Summary Report")}
        <h2>User Activity Logs</h2>
        ${toExcelTable(activityRows, "User Activity Logs")}
        <script>window.print();</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export default function AdminReports() {
  const [data, setData] = useState({
    users: [],
    services: [],
    applications: [],
    requirements: [],
    vouchers: [],
    requests: [],
    logs: []
  });
  const [filters, setFilters] = useState({ from: "", to: "", activity: "All" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/users"),
      api.get("/services"),
      api.get("/applications"),
      api.get("/requirements"),
      api.get("/vouchers"),
      api.get("/support"),
      api.get("/audit-logs")
    ])
      .then(([users, services, applications, requirements, vouchers, requests, logs]) => {
        setData({
          users: users.data,
          services: services.data,
          applications: applications.data,
          requirements: requirements.data,
          vouchers: vouchers.data,
          requests: requests.data,
          logs: logs.data
        });
      })
      .catch(() => setMessage("Failed to load reports."));
  }, []);

  const filtered = useMemo(() => ({
    applications: data.applications.filter((item) => inRange(item.date_applied, filters.from, filters.to)),
    requirements: data.requirements.filter((item) => inRange(item.date_submitted, filters.from, filters.to)),
    vouchers: data.vouchers.filter((item) => inRange(item.date_generated, filters.from, filters.to)),
    requests: data.requests.filter((item) => inRange(item.date_submitted, filters.from, filters.to)),
    logs: data.logs.filter((item) => inRange(item.date_created, filters.from, filters.to))
  }), [data, filters]);

  const summaryRows = useMemo(() => [
    { Metric: "Total Users", Count: data.users.length },
    { Metric: "Total Services", Count: data.services.length },
    { Metric: "Pending Applications", Count: filtered.applications.filter((app) => app.status === "Pending").length },
    { Metric: "Approved Applications", Count: filtered.applications.filter((app) => app.status === "Approved").length },
    { Metric: "Requirements Submitted", Count: filtered.applications.filter((app) => app.status === "Requirements Submitted").length },
    { Metric: "Requirements Verified", Count: filtered.requirements.filter((item) => item.status === "Requirements Verified").length },
    { Metric: "Generated Vouchers", Count: filtered.vouchers.length },
    { Metric: "Support Requests", Count: filtered.requests.length },
    { Metric: "Audit Log Entries", Count: filtered.logs.length }
  ], [data, filtered]);

  const activityRows = useMemo(() => {
    const applicationRows = filtered.applications.map((app) => ({
      Date: app.date_applied,
      Type: "Application",
      User: app.user_name,
      Details: `${app.service_name} - ${app.status}`
    }));
    const requirementRows = filtered.requirements.map((requirement) => ({
      Date: requirement.date_submitted,
      Type: "Requirement",
      User: requirement.user_name,
      Details: `${requirement.service_name} - ${requirement.status}`
    }));
    const supportRows = filtered.requests.map((request) => ({
      Date: request.date_submitted,
      Type: "Support",
      User: request.user_name,
      Details: `${request.subject} - ${request.status}`
    }));
    const voucherRows = filtered.vouchers.map((voucher) => ({
      Date: voucher.date_generated,
      Type: "Voucher",
      User: voucher.user_name,
      Details: `${voucher.voucher_code} - ${voucher.status}`
    }));

    return [...applicationRows, ...requirementRows, ...supportRows, ...voucherRows]
      .filter((row) => filters.activity === "All" || row.Type === filters.activity)
      .sort((a, b) => (parseDate(b.Date)?.getTime() || 0) - (parseDate(a.Date)?.getTime() || 0));
  }, [filtered, filters.activity]);

  const statusChart = useMemo(() => {
    const statuses = ["Pending", "Approved", "Requirements Submitted", "Voucher Generated", "Rejected"];
    return statuses.map((status) => ({
      label: status,
      value: filtered.applications.filter((app) => app.status === status).length
    }));
  }, [filtered.applications]);

  const serviceChart = useMemo(() => {
    const counts = {};
    filtered.applications.forEach((app) => {
      counts[app.service_name] = (counts[app.service_name] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value })).slice(0, 6);
  }, [filtered.applications]);

  const exportSummaryCsv = () => downloadFile("pwdconnect-summary-report.csv", toCsv(summaryRows), "text/csv;charset=utf-8");
  const exportActivityCsv = () => downloadFile("pwdconnect-user-activity-logs.csv", toCsv(activityRows), "text/csv;charset=utf-8");
  const exportExcel = () => {
    const workbook = `
      <html><head><meta charset="utf-8" /></head><body>
        <h1>PWDConnect PH Reports</h1>
        <h2>Summary Report</h2>${toExcelTable(summaryRows, "Summary Report")}
        <h2>User Activity Logs</h2>${toExcelTable(activityRows, "User Activity Logs")}
      </body></html>
    `;
    downloadFile("pwdconnect-reports.xls", workbook, "application/vnd.ms-excel;charset=utf-8");
  };

  return (
    <Layout role="admin" title="Reports" subtitle="Generate summary reports, user activity logs, charts, and export files.">
      {message && <div className="alert error">{message}</div>}

      <section className="panel filterPanel">
        <div className="filterRow">
          <label>
            <span>From</span>
            <input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
          </label>
          <label>
            <span>To</span>
            <input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
          </label>
          <label>
            <span>Activity Type</span>
            <select value={filters.activity} onChange={(event) => setFilters({ ...filters, activity: event.target.value })}>
              {["All", "Application", "Requirement", "Support", "Voucher"].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <div className="actions reportActions">
            <button type="button" onClick={exportSummaryCsv}><Icon name="download" />Summary CSV</button>
            <button type="button" onClick={exportActivityCsv}><Icon name="download" />Logs CSV</button>
            <button type="button" onClick={exportExcel}><Icon name="file" />Excel</button>
            <button type="button" onClick={() => printReport("PWDConnect PH Reports", summaryRows, activityRows)}><Icon name="file" />PDF</button>
          </div>
        </div>
      </section>

      <section className="statsGrid">
        {summaryRows.slice(0, 8).map((row) => (
          <div className="statCard" key={row.Metric}>
            <div className="statIcon"><Icon name={row.Metric.includes("Voucher") ? "voucher" : row.Metric.includes("Support") ? "help" : row.Metric.includes("Service") ? "briefcase" : "chart"} /></div>
            <span>{row.Metric}</span>
            <h3>{row.Count}</h3>
            <p>Filtered report count</p>
          </div>
        ))}
      </section>

      <section className="dashboardGrid">
        <div className="panel">
          <div className="sectionHeader">
            <div>
              <h2>Applications by Status</h2>
              <p>System-generated chart from current application records.</p>
            </div>
          </div>
          <BarChart data={statusChart} />
        </div>
        <div className="panel">
          <div className="sectionHeader">
            <div>
              <h2>Top Services</h2>
              <p>Applications grouped by service.</p>
            </div>
          </div>
          <DonutChart data={serviceChart} />
        </div>
      </section>

      <section className="dashboardGrid">
        <div className="panel">
          <TableHeader title="Summary Report" />
          <ReportTable columns={["Metric", "Count"]} rows={summaryRows} />
        </div>
        <div className="panel">
          <TableHeader title="Admin Audit Logs" />
          <ReportTable
            columns={["Date", "Admin", "Action", "Description"]}
            rows={filtered.logs.slice(0, 12).map((log) => ({
              Date: new Date(log.date_created).toLocaleString(),
              Admin: log.admin_name || "System",
              Action: log.action,
              Description: log.description || `${log.target_table} #${log.target_id}`
            }))}
          />
        </div>
      </section>

      <section className="panel">
        <TableHeader title="User Activity Logs" />
        <ReportTable
          columns={["Date", "Type", "User", "Details"]}
          rows={activityRows.map((row) => ({
            ...row,
            Date: row.Date ? new Date(row.Date).toLocaleString() : ""
          }))}
        />
      </section>
    </Layout>
  );
}

function TableHeader({ title }) {
  return (
    <div className="sectionHeader">
      <h2>{title}</h2>
    </div>
  );
}

function ReportTable({ columns, rows }) {
  return (
    <div className="tableWrap">
      <table className="dataTable">
        <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row[columns[0]]}-${index}`}>
              {columns.map((column) => (
                <td key={column}>
                  {column === "Type" ? <span className={`status ${statusClass(row[column])}`}>{row[column]}</span> : row[column]}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={columns.length}>No records found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <div className="barChart" role="img" aria-label="Bar chart">
      {data.map((item) => (
        <div className="barRow" key={item.label}>
          <span>{item.label}</span>
          <div className="barTrack">
            <div className="barFill" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const palette = ["#1f6feb", "#0f9f8f", "#b7791f", "#138a4f", "#d33f49", "#64748b"];
  let cumulative = 0;
  const segments = total === 0 ? [] : data.map((item, index) => {
    const start = cumulative / total;
    cumulative += item.value;
    const end = cumulative / total;
    return { ...item, color: palette[index % palette.length], start, end };
  });

  return (
    <div className="donutWrap">
      <svg className="donutChart" viewBox="0 0 42 42" role="img" aria-label="Donut chart">
        <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="var(--surface-muted)" strokeWidth="8" />
        {segments.map((segment) => (
          <circle
            key={segment.label}
            cx="21"
            cy="21"
            r="15.9"
            fill="transparent"
            stroke={segment.color}
            strokeWidth="8"
            strokeDasharray={`${(segment.end - segment.start) * 100} ${100 - ((segment.end - segment.start) * 100)}`}
            strokeDashoffset={25 - segment.start * 100}
          />
        ))}
        <text x="21" y="21" textAnchor="middle" dominantBaseline="central" className="donutText">{total}</text>
      </svg>
      <div className="chartLegend">
        {data.length === 0 && <p>No service activity yet.</p>}
        {data.map((item, index) => (
          <div key={item.label}>
            <span style={{ background: palette[index % palette.length] }} />
            <strong>{item.label}</strong>
            <em>{item.value}</em>
          </div>
        ))}
      </div>
    </div>
  );
}
