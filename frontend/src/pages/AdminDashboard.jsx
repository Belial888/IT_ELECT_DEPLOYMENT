import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";
import Icon from "../components/Icon";

const statusClass = (status = "") => status.toLowerCase().replace(/\s+/g, "-");

export default function AdminDashboard() {
  const [data, setData] = useState({
    users: [],
    services: [],
    applications: [],
    requirements: [],
    vouchers: [],
    requests: [],
    logs: []
  });
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
      .catch(() => setMessage("Failed to load dashboard overview."));
  }, []);

  const stats = useMemo(() => ({
    users: data.users.length,
    services: data.services.length,
    pending: data.applications.filter((app) => app.status === "Pending").length,
    approved: data.applications.filter((app) => app.status === "Approved").length,
    submitted: data.applications.filter((app) => app.status === "Requirements Submitted").length,
    verified: data.requirements.filter((item) => item.status === "Requirements Verified").length,
    vouchers: data.vouchers.length,
    support: data.requests.filter((item) => item.status !== "Resolved").length
  }), [data]);

  const modules = [
    { to: "/admin/users", icon: "users", label: "Users", value: stats.users },
    { to: "/admin/services", icon: "briefcase", label: "Services", value: stats.services },
    { to: "/admin/applications", icon: "clipboard", label: "Applications", value: data.applications.length },
    { to: "/admin/requirements", icon: "file", label: "Requirements", value: data.requirements.length },
    { to: "/admin/vouchers", icon: "voucher", label: "Vouchers", value: stats.vouchers },
    { to: "/admin/support", icon: "help", label: "Support", value: data.requests.length },
    { to: "/admin/announcements", icon: "announcement", label: "Announcements", value: "Open" },
    { to: "/admin/audit-logs", icon: "shield", label: "Audit Logs", value: data.logs.length }
  ];

  return (
    <Layout role="admin" title="Admin Dashboard" subtitle="A quick overview of system activity. Use the sidebar to manage records.">
      {message && <div className="alert error">{message}</div>}

      <section className="statsGrid">
        <div className="statCard"><div className="statIcon"><Icon name="users" /></div><span>Total Users</span><h3>{stats.users}</h3><p>Registered PWD users</p></div>
        <div className="statCard"><div className="statIcon"><Icon name="briefcase" /></div><span>Total Services</span><h3>{stats.services}</h3><p>Available assistance programs</p></div>
        <div className="statCard"><div className="statIcon"><Icon name="clipboard" /></div><span>Pending</span><h3>{stats.pending}</h3><p>Applications needing review</p></div>
        <div className="statCard"><div className="statIcon"><Icon name="file" /></div><span>Requirements</span><h3>{stats.submitted}</h3><p>Submitted for verification</p></div>
        <div className="statCard"><div className="statIcon"><Icon name="shield" /></div><span>Verified</span><h3>{stats.verified}</h3><p>Requirement records passed</p></div>
        <div className="statCard"><div className="statIcon"><Icon name="voucher" /></div><span>Vouchers</span><h3>{stats.vouchers}</h3><p>Generated assistance proofs</p></div>
        <div className="statCard"><div className="statIcon"><Icon name="help" /></div><span>Open Support</span><h3>{stats.support}</h3><p>Requests not yet resolved</p></div>
        <div className="statCard"><div className="statIcon"><Icon name="check" /></div><span>Approved</span><h3>{stats.approved}</h3><p>Waiting for requirements</p></div>
      </section>

      <section className="panel">
        <div className="sectionHeader">
          <div>
            <h2>Management Areas</h2>
            <p>Record management has been moved out of the dashboard for a cleaner workflow.</p>
          </div>
        </div>
        <div className="moduleGrid">
          {modules.map((module) => (
            <Link className="moduleCard" key={module.to} to={module.to}>
              <div className="statIcon"><Icon name={module.icon} /></div>
              <span>{module.label}</span>
              <strong>{module.value}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="contentGrid">
        <div className="panel">
          <h2>Recent Applications</h2>
          <div className="list">
            {data.applications.slice(0, 5).map((app) => (
              <div className="listItem" key={app.app_id}>
                <div className="itemMain">
                  <h3>{app.service_name}</h3>
                  <p>{app.user_name}</p>
                  <small>{new Date(app.date_applied).toLocaleString()}</small>
                </div>
                <span className={`status ${statusClass(app.status)}`}>{app.status}</span>
              </div>
            ))}
            {data.applications.length === 0 && <div className="emptyState">No applications yet.</div>}
          </div>
        </div>

        <div className="panel">
          <h2>Recent Audit Logs</h2>
          <div className="list">
            {data.logs.slice(0, 5).map((log) => (
              <div className="listItem" key={log.log_id}>
                <div className="itemMain">
                  <h3>{log.action}</h3>
                  <p>{log.description || `${log.target_table} #${log.target_id}`}</p>
                  <small>{new Date(log.date_created).toLocaleString()}</small>
                </div>
              </div>
            ))}
            {data.logs.length === 0 && <div className="emptyState">No audit logs yet.</div>}
          </div>
        </div>
      </section>
    </Layout>
  );
}
