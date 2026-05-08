import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import Icon from "../components/Icon";

const emptyUser = { name: "", disability_type: "", contact_info: "", address: "", username: "", password: "" };
const emptyService = { service_name: "", description: "", provider: "", eligibility: "", category: "General" };
const emptyAnnouncement = { title: "", content: "" };
const statusClass = (status = "") => status.toLowerCase().replace(/\s+/g, "-");
const requirementFileFields = [
  ["valid_id", "Valid ID"],
  ["pwd_id", "PWD ID"],
  ["medical_certificate", "Medical"],
  ["other_document", "Other"]
];

function matchesSearch(item, search, fields) {
  const keyword = search.trim().toLowerCase();
  if (!keyword) return true;
  return fields.some((field) => String(item[field] || "").toLowerCase().includes(keyword));
}

const config = {
  users: { title: "Manage Users", subtitle: "Create, edit, search, and delete PWD user accounts." },
  services: { title: "Manage Services", subtitle: "Maintain assistance programs and service eligibility details." },
  applications: { title: "Manage Applications", subtitle: "Approve, reject, verify, or remove service applications." },
  requirements: { title: "Manage Requirements", subtitle: "Review uploaded files and verify or reject requirements." },
  announcements: { title: "Manage Announcements", subtitle: "Create and maintain public notices." },
  support: { title: "Manage Support", subtitle: "Reply to user support requests and update their status." },
  vouchers: { title: "Manage Vouchers", subtitle: "View QR codes and update voucher status." },
  audit: { title: "Audit Logs", subtitle: "Review important admin actions and system records." }
};

export default function AdminManage({ module }) {
  const page = config[module] || config.users;
  const [data, setData] = useState({
    users: [],
    services: [],
    applications: [],
    requirements: [],
    announcements: [],
    requests: [],
    vouchers: [],
    logs: []
  });
  const [filters, setFilters] = useState({});
  const [message, setMessage] = useState("");
  const [userForm, setUserForm] = useState(emptyUser);
  const [editingUserId, setEditingUserId] = useState(null);
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState(emptyAnnouncement);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);

  const load = async () => {
    const [users, services, applications, requirements, announcements, requests, vouchers, logs] = await Promise.all([
      api.get("/users"),
      api.get("/services"),
      api.get("/applications"),
      api.get("/requirements"),
      api.get("/announcements"),
      api.get("/support"),
      api.get("/vouchers"),
      api.get("/audit-logs")
    ]);
    setData({
      users: users.data,
      services: services.data,
      applications: applications.data,
      requirements: requirements.data,
      announcements: announcements.data,
      requests: requests.data,
      vouchers: vouchers.data,
      logs: logs.data
    });
  };

  useEffect(() => {
    load().catch(() => setMessage("Failed to load records."));
  }, [module]);

  const requirementsByApp = useMemo(
    () => Object.fromEntries(data.requirements.map((requirement) => [requirement.app_id, requirement])),
    [data.requirements]
  );

  const notify = (text) => {
    setMessage(text);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitUser = async (event) => {
    event.preventDefault();
    try {
      if (editingUserId) {
        await api.put(`/users/${editingUserId}`, userForm);
        notify("User updated.");
      } else {
        await api.post("/users", userForm);
        notify("User created.");
      }
      setUserForm(emptyUser);
      setEditingUserId(null);
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to save user.");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user account and related records?")) return;
    try {
      await api.delete(`/users/${userId}`);
      notify("User deleted.");
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to delete user.");
    }
  };

  const submitService = async (event) => {
    event.preventDefault();
    try {
      if (editingServiceId) {
        await api.put(`/services/${editingServiceId}`, serviceForm);
        notify("Service updated.");
      } else {
        await api.post("/services", serviceForm);
        notify("Service created.");
      }
      setServiceForm(emptyService);
      setEditingServiceId(null);
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to save service.");
    }
  };

  const deleteService = async (serviceId) => {
    if (!window.confirm("Delete this service?")) return;
    try {
      await api.delete(`/services/${serviceId}`);
      notify("Service deleted.");
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to delete service.");
    }
  };

  const updateApplication = async (app, status) => {
    const remarks = status === "Rejected" ? window.prompt("Reason for rejection", app.remarks || "") : app.remarks || "";
    if (status === "Rejected" && remarks === null) return;
    if (!window.confirm(`Set this application to ${status}?`)) return;

    try {
      await api.put(`/applications/${app.app_id}/status`, { status, remarks });
      notify(`Application set to ${status}.`);
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to update application.");
    }
  };

  const deleteApplication = async (appId) => {
    if (!window.confirm("Delete this application record?")) return;
    try {
      await api.delete(`/applications/${appId}`);
      notify("Application deleted.");
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to delete application.");
    }
  };

  const verifyRequirement = async (requirement) => {
    if (!window.confirm("Verify these requirements and generate a voucher?")) return;
    try {
      await api.put(`/requirements/${requirement.requirement_id}/verify`, { remarks: "Requirements verified" });
      notify("Requirements verified and voucher generated.");
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to verify requirements.");
    }
  };

  const rejectRequirement = async (requirement) => {
    const remarks = window.prompt("Reason or correction notes", requirement.remarks || "");
    if (remarks === null) return;
    try {
      await api.put(`/requirements/${requirement.requirement_id}/reject`, { remarks });
      notify("Requirements rejected.");
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to reject requirements.");
    }
  };

  const deleteRequirement = async (requirementId) => {
    if (!window.confirm("Delete this requirement record?")) return;
    try {
      await api.delete(`/requirements/${requirementId}`);
      notify("Requirements deleted.");
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to delete requirements.");
    }
  };

  const submitAnnouncement = async (event) => {
    event.preventDefault();
    try {
      if (editingAnnouncementId) {
        await api.put(`/announcements/${editingAnnouncementId}`, announcementForm);
        notify("Announcement updated.");
      } else {
        await api.post("/announcements", announcementForm);
        notify("Announcement posted.");
      }
      setAnnouncementForm(emptyAnnouncement);
      setEditingAnnouncementId(null);
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to save announcement.");
    }
  };

  const deleteAnnouncement = async (announcementId) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await api.delete(`/announcements/${announcementId}`);
      notify("Announcement deleted.");
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to delete announcement.");
    }
  };

  const updateSupport = async (request, status) => {
    const adminReply = window.prompt("Admin reply or remarks", request.admin_reply || "");
    if (adminReply === null) return;
    try {
      await api.put(`/support/${request.request_id}/status`, { status, admin_reply: adminReply });
      notify("Support request updated.");
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to update support request.");
    }
  };

  const deleteSupport = async (requestId) => {
    if (!window.confirm("Delete this support request?")) return;
    try {
      await api.delete(`/support/${requestId}`);
      notify("Support request deleted.");
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to delete support request.");
    }
  };

  const updateVoucher = async (voucherId, status) => {
    if (!window.confirm(`Set voucher to ${status}?`)) return;
    try {
      await api.put(`/vouchers/${voucherId}/status`, { status });
      notify("Voucher status updated.");
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to update voucher.");
    }
  };

  const deleteVoucher = async (voucherId) => {
    if (!window.confirm("Delete this voucher?")) return;
    try {
      await api.delete(`/vouchers/${voucherId}`);
      notify("Voucher deleted.");
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to delete voucher.");
    }
  };

  return (
    <Layout role="admin" title={page.title} subtitle={page.subtitle}>
      {message && <div className="alert">{message}</div>}
      {module === "users" && (
        <section className="adminGrid">
          <form className="panel formPanel" onSubmit={submitUser}>
            <h2>{editingUserId ? "Edit User" : "Create User"}</h2>
            <label>Name<input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} required /></label>
            <label>Disability Type<input value={userForm.disability_type} onChange={(e) => setUserForm({ ...userForm, disability_type: e.target.value })} required /></label>
            <label>Contact Info<input value={userForm.contact_info} onChange={(e) => setUserForm({ ...userForm, contact_info: e.target.value })} required /></label>
            <label>Address<input value={userForm.address || ""} onChange={(e) => setUserForm({ ...userForm, address: e.target.value })} /></label>
            <label>Username<input value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} required /></label>
            <label>Password<input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required={!editingUserId} placeholder={editingUserId ? "Leave blank to keep current password" : ""} /></label>
            <button className="primaryBtn"><Icon name="users" />{editingUserId ? "Save User" : "Create User"}</button>
            {editingUserId && <button type="button" className="secondaryBtn fullWidthBtn" onClick={() => { setEditingUserId(null); setUserForm(emptyUser); }}>Cancel Edit</button>}
          </form>
          <UsersTable users={data.users} search={filters.users || ""} setSearch={(value) => setFilters({ ...filters, users: value })} editUser={(user) => { setEditingUserId(user.user_id); setUserForm({ ...emptyUser, ...user, password: "" }); }} deleteUser={deleteUser} />
        </section>
      )}

      {module === "services" && (
        <section className="adminGrid">
          <form className="panel formPanel" onSubmit={submitService}>
            <h2>{editingServiceId ? "Edit Service" : "Create Service"}</h2>
            <label>Service Name<input value={serviceForm.service_name} onChange={(e) => setServiceForm({ ...serviceForm, service_name: e.target.value })} required /></label>
            <label>Description<textarea value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} required /></label>
            <label>Provider<input value={serviceForm.provider} onChange={(e) => setServiceForm({ ...serviceForm, provider: e.target.value })} required /></label>
            <label>Eligibility<input value={serviceForm.eligibility} onChange={(e) => setServiceForm({ ...serviceForm, eligibility: e.target.value })} required /></label>
            <label>Category<input value={serviceForm.category} onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })} /></label>
            <button className="primaryBtn"><Icon name="briefcase" />{editingServiceId ? "Save Service" : "Create Service"}</button>
            {editingServiceId && <button type="button" className="secondaryBtn fullWidthBtn" onClick={() => { setEditingServiceId(null); setServiceForm(emptyService); }}>Cancel Edit</button>}
          </form>
          <ServicesTable services={data.services} search={filters.services || ""} setSearch={(value) => setFilters({ ...filters, services: value })} editService={(service) => { setEditingServiceId(service.service_id); setServiceForm({ ...emptyService, ...service }); }} deleteService={deleteService} />
        </section>
      )}

      {module === "applications" && <ApplicationsTable applications={data.applications} requirementsByApp={requirementsByApp} search={filters.applications || ""} setSearch={(value) => setFilters({ ...filters, applications: value })} updateApplication={updateApplication} verifyRequirement={verifyRequirement} deleteApplication={deleteApplication} />}
      {module === "requirements" && <RequirementsTable requirements={data.requirements} search={filters.requirements || ""} setSearch={(value) => setFilters({ ...filters, requirements: value })} verifyRequirement={verifyRequirement} rejectRequirement={rejectRequirement} deleteRequirement={deleteRequirement} />}
      {module === "announcements" && <AnnouncementsManager announcements={data.announcements} form={announcementForm} setForm={setAnnouncementForm} editingId={editingAnnouncementId} setEditingId={setEditingAnnouncementId} submit={submitAnnouncement} remove={deleteAnnouncement} />}
      {module === "support" && <SupportTable requests={data.requests} search={filters.requests || ""} setSearch={(value) => setFilters({ ...filters, requests: value })} updateSupport={updateSupport} deleteSupport={deleteSupport} />}
      {module === "vouchers" && <VouchersTable vouchers={data.vouchers} search={filters.vouchers || ""} setSearch={(value) => setFilters({ ...filters, vouchers: value })} updateVoucher={updateVoucher} deleteVoucher={deleteVoucher} />}
      {module === "audit" && <AuditTable logs={data.logs} search={filters.logs || ""} setSearch={(value) => setFilters({ ...filters, logs: value })} />}
    </Layout>
  );
}

function TableHeader({ title, value, onChange, placeholder }) {
  return (
    <div className="sectionHeader tableHeader">
      <h2>{title}</h2>
      <label className="searchControl">
        <span>Search</span>
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      </label>
    </div>
  );
}

function UsersTable({ users, search, setSearch, editUser, deleteUser }) {
  const filtered = users.filter((user) => matchesSearch(user, search, ["name", "username", "disability_type", "contact_info"]));
  return (
    <div className="panel">
      <TableHeader title="Users" value={search} onChange={setSearch} placeholder="Search by name, username, disability, contact" />
      <Table columns={["Name", "Username", "Disability", "Contact", "Applications", "Actions"]}>
        {filtered.map((user) => (
          <tr key={user.user_id}>
            <td>{user.name}</td><td>{user.username}</td><td>{user.disability_type}</td><td>{user.contact_info}</td><td>{user.application_count}</td>
            <td><button className="secondaryBtn" onClick={() => editUser(user)}><Icon name="file" />Edit</button><button className="dangerBtn" onClick={() => deleteUser(user.user_id)}><Icon name="x" />Delete</button></td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function ServicesTable({ services, search, setSearch, editService, deleteService }) {
  const filtered = services.filter((service) => matchesSearch(service, search, ["service_name", "provider", "category", "eligibility"]));
  return (
    <div className="panel">
      <TableHeader title="Services" value={search} onChange={setSearch} placeholder="Search by service, provider, category, eligibility" />
      <Table columns={["Service", "Provider", "Category", "Eligibility", "Actions"]}>
        {filtered.map((service) => (
          <tr key={service.service_id}>
            <td>{service.service_name}</td><td>{service.provider}</td><td>{service.category}</td><td>{service.eligibility}</td>
            <td><button className="secondaryBtn" onClick={() => editService(service)}><Icon name="file" />Edit</button><button className="dangerBtn" onClick={() => deleteService(service.service_id)}><Icon name="x" />Delete</button></td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function ApplicationsTable({ applications, requirementsByApp, search, setSearch, updateApplication, verifyRequirement, deleteApplication }) {
  const filtered = applications.filter((app) => matchesSearch(app, search, ["user_name", "service_name", "status"]));
  return (
    <div className="panel">
      <TableHeader title="Applications" value={search} onChange={setSearch} placeholder="Search by user, service, or status" />
      <Table columns={["User", "Service", "Status", "Applied", "Remarks", "Actions"]}>
        {filtered.map((app) => (
          <tr key={app.app_id}>
            <td>{app.user_name}</td><td>{app.service_name}</td><td><span className={`status ${statusClass(app.status)}`}>{app.status}</span></td><td>{new Date(app.date_applied).toLocaleDateString()}</td><td>{app.remarks || "None"}</td>
            <td>
              {app.status === "Pending" && <button onClick={() => updateApplication(app, "Approved")}><Icon name="check" />Approve</button>}
              {app.status !== "Rejected" && app.status !== "Voucher Generated" && <button className="dangerBtn" onClick={() => updateApplication(app, "Rejected")}><Icon name="x" />Reject</button>}
              {app.status === "Requirements Submitted" && requirementsByApp[app.app_id] && <button onClick={() => verifyRequirement(requirementsByApp[app.app_id])}><Icon name="shield" />Verify</button>}
              <button className="dangerBtn" onClick={() => deleteApplication(app.app_id)}><Icon name="x" />Delete</button>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function RequirementsTable({ requirements, search, setSearch, verifyRequirement, rejectRequirement, deleteRequirement }) {
  const filtered = requirements.filter((requirement) => matchesSearch(requirement, search, ["user_name", "service_name", "status"]));
  return (
    <div className="panel">
      <TableHeader title="Requirements" value={search} onChange={setSearch} placeholder="Search by user, service, or status" />
      <Table columns={["User", "Service", "Status", "Files", "Remarks", "Actions"]}>
        {filtered.map((requirement) => (
          <tr key={requirement.requirement_id}>
            <td>{requirement.user_name}</td><td>{requirement.service_name}</td><td><span className={`status ${statusClass(requirement.status)}`}>{requirement.status}</span></td>
            <td className="fileLinks">
              {requirementFileFields.map(([field, label]) => (
                requirement[field] ? <a href={requirement[field]} target="_blank" rel="noreferrer" key={field}>{label}</a> : null
              ))}
            </td>
            <td>{requirement.remarks || "None"}</td>
            <td>
              {requirement.status === "Requirements Submitted" && <button onClick={() => verifyRequirement(requirement)}><Icon name="shield" />Verify</button>}
              {requirement.status === "Requirements Submitted" && <button className="dangerBtn" onClick={() => rejectRequirement(requirement)}><Icon name="x" />Reject</button>}
              <button className="dangerBtn" onClick={() => deleteRequirement(requirement.requirement_id)}><Icon name="x" />Delete</button>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function AnnouncementsManager({ announcements, form, setForm, editingId, setEditingId, submit, remove }) {
  return (
    <section className="adminGrid">
      <form className="panel formPanel" onSubmit={submit}>
        <h2>{editingId ? "Edit Announcement" : "Create Announcement"}</h2>
        <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
        <label>Content<textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required /></label>
        <button className="primaryBtn"><Icon name="announcement" />{editingId ? "Save Announcement" : "Post Announcement"}</button>
        {editingId && <button type="button" className="secondaryBtn fullWidthBtn" onClick={() => { setEditingId(null); setForm(emptyAnnouncement); }}>Cancel Edit</button>}
      </form>
      <div className="panel">
        <h2>Announcements</h2>
        <div className="list">
          {announcements.map((announcement) => (
            <div className="listItem" key={announcement.announcement_id}>
              <div className="itemMain"><h3>{announcement.title}</h3><p>{announcement.content}</p><small>{new Date(announcement.date_posted).toLocaleString()}</small></div>
              <div className="actions">
                <button className="secondaryBtn" onClick={() => { setEditingId(announcement.announcement_id); setForm({ title: announcement.title, content: announcement.content }); }}><Icon name="file" />Edit</button>
                <button className="dangerBtn" onClick={() => remove(announcement.announcement_id)}><Icon name="x" />Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SupportTable({ requests, search, setSearch, updateSupport, deleteSupport }) {
  const filtered = requests.filter((request) => matchesSearch(request, search, ["subject", "status", "user_name"]));
  return (
    <div className="panel">
      <TableHeader title="Support Requests" value={search} onChange={setSearch} placeholder="Search by subject, status, or user" />
      <Table columns={["User", "Subject", "Message", "Status", "Admin Reply", "Actions"]}>
        {filtered.map((request) => (
          <tr key={request.request_id}>
            <td>{request.user_name}</td><td>{request.subject}</td><td>{request.message}</td><td><span className={`status ${statusClass(request.status)}`}>{request.status}</span></td><td>{request.admin_reply || "None"}</td>
            <td><button className="secondaryBtn" onClick={() => updateSupport(request, "In Progress")}><Icon name="help" />In Progress</button><button onClick={() => updateSupport(request, "Resolved")}><Icon name="check" />Resolved</button><button className="dangerBtn" onClick={() => deleteSupport(request.request_id)}><Icon name="x" />Delete</button></td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function VouchersTable({ vouchers, search, setSearch, updateVoucher, deleteVoucher }) {
  const filtered = vouchers.filter((voucher) => matchesSearch(voucher, search, ["voucher_code", "user_name", "service_name", "status"]));
  return (
    <div className="panel">
      <TableHeader title="Vouchers" value={search} onChange={setSearch} placeholder="Search by code, user, service, or status" />
      <Table columns={["Code", "User", "Service", "Status", "QR", "Actions"]}>
        {filtered.map((voucher) => (
          <tr key={voucher.voucher_id}>
            <td>{voucher.voucher_code}</td><td>{voucher.user_name}</td><td>{voucher.service_name}</td><td><span className={`status ${statusClass(voucher.status)}`}>{voucher.status}</span></td><td>{voucher.qr_code && <img className="qrThumb" src={voucher.qr_code} alt={`QR for ${voucher.voucher_code}`} />}</td>
            <td>
              {["Active", "Used", "Expired", "Cancelled"].map((status) => <button className="secondaryBtn" key={status} onClick={() => updateVoucher(voucher.voucher_id, status)}>{status}</button>)}
              <button className="dangerBtn" onClick={() => deleteVoucher(voucher.voucher_id)}><Icon name="x" />Delete</button>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function AuditTable({ logs, search, setSearch }) {
  const filtered = logs.filter((log) => matchesSearch(log, search, ["admin_name", "action", "target_table", "description", "date_created"]));
  return (
    <div className="panel">
      <TableHeader title="Audit Logs" value={search} onChange={setSearch} placeholder="Search by admin, action, target, date" />
      <Table columns={["Date", "Admin", "Action", "Target", "Description"]}>
        {filtered.map((log) => (
          <tr key={log.log_id}>
            <td>{new Date(log.date_created).toLocaleString()}</td><td>{log.admin_name || "System"}</td><td>{log.action}</td><td>{log.target_table} #{log.target_id}</td><td>{log.description}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function Table({ columns, children }) {
  return (
    <div className="tableWrap">
      <table className="dataTable">
        <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
