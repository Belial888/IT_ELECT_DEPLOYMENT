import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";

export default function UserDashboard() {
  const [announcements, setAnnouncements] = useState([]);
  const [applications, setApplications] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const name = localStorage.getItem("name") || "User";

  useEffect(() => {
    Promise.all([
      api.get("/announcements"),
      api.get("/applications/my"),
      api.get("/vouchers/my")
    ]).then(([annRes, appRes, voucherRes]) => {
      setAnnouncements(annRes.data.slice(0, 3));
      setApplications(appRes.data);
      setVouchers(voucherRes.data);
    }).catch(() => {});
  }, []);

  return (
    <Layout title={`Welcome, ${name}!`} subtitle="Access services, track applications, and manage support requests.">
      <section className="statsGrid">
        <div className="statCard">
          <div className="statIcon"><Icon name="briefcase" /></div>
          <span>Services</span>
          <h3>6+</h3>
          <p>Available assistance programs</p>
        </div>
        <div className="statCard">
          <div className="statIcon"><Icon name="clipboard" /></div>
          <span>Applications</span>
          <h3>{applications.length}</h3>
          <p>{applications.filter((app) => app.status === "Pending").length} pending review</p>
        </div>
        <div className="statCard">
          <div className="statIcon"><Icon name="voucher" /></div>
          <span>Vouchers</span>
          <h3>{vouchers.length}</h3>
          <p>Approved assistance proofs</p>
        </div>
      </section>

      <section className="contentGrid">
        <div className="panel largePanel">
          <h2>Announcements</h2>
          {announcements.map(item => (
            <article className="announcementItem" key={item.announcement_id}>
              <h3>{item.title}</h3>
              <p>{item.content}</p>
              <small>{new Date(item.date_posted).toLocaleString()}</small>
            </article>
          ))}
        </div>

        <div className="panel">
          <h2>Quick Actions</h2>
          <div className="quickActions">
            <Link to="/user/services"><Icon name="search" />Browse Services</Link>
            <Link to="/user/applications"><Icon name="clipboard" />My Applications</Link>
            <Link to="/user/requests"><Icon name="send" />My Requests</Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
