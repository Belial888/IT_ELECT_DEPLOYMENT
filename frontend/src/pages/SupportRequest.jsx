import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import Icon from "../components/Icon";

export default function SupportRequest() {
  const [services, setServices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ service_id: "", subject: "", message: "" });
  const [notice, setNotice] = useState("");

  const load = async () => {
    const [servicesRes, requestsRes] = await Promise.all([
      api.get("/services"),
      api.get("/support/my")
    ]);
    setServices(servicesRes.data);
    setRequests(requestsRes.data);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setNotice("");
    try {
      await api.post("/support", form);
      setForm({ service_id: "", subject: "", message: "" });
      setNotice("Support request submitted.");
      load();
    } catch (err) {
      setNotice(err.response?.data?.message || "Failed to submit request");
    }
  };

  return (
    <Layout title="My Requests" subtitle="Manage your service-related concerns and support requests.">
      <section className="contentGrid">
        <form className="panel formPanel" onSubmit={submit}>
          <h2>New Request</h2>
          {notice && <div className="alert">{notice}</div>}

          <label>Related Service</label>
          <select value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })}>
            <option value="">General Concern</option>
            {services.map(s => <option key={s.service_id} value={s.service_id}>{s.service_name}</option>)}
          </select>

          <label>Subject</label>
          <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />

          <label>Message</label>
          <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />

          <button className="primaryBtn">
            <Icon name="send" />
            <span>Submit Request</span>
          </button>
        </form>

        <div className="panel largePanel">
          <h2>Request History</h2>
          <div className="list">
            {requests.length === 0 && <p>No requests submitted yet.</p>}
            {requests.map(req => (
              <div className="listItem" key={req.request_id}>
                <div>
                  <h3>{req.subject}</h3>
                  <p>{req.message}</p>
                  {req.admin_reply && <p><strong>Admin reply:</strong> {req.admin_reply}</p>}
                  <small>{req.service_name || "General Concern"} - {new Date(req.date_submitted).toLocaleString()}</small>
                </div>
                <span className={`status ${req.status.toLowerCase().replace(/\s+/g, "-")}`}>{req.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
