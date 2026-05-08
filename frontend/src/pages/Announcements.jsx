import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const role = localStorage.getItem("role") || "user";

  useEffect(() => {
    api.get("/announcements").then(res => setAnnouncements(res.data)).catch(() => {});
  }, []);

  return (
    <Layout role={role} title="Announcements" subtitle="Latest news, programs, and updates.">
      <div className="panel">
        <div className="list">
          {announcements.map(item => (
            <div className="listItem" key={item.announcement_id}>
              <div>
                <h3>{item.title}</h3>
                <p>{item.content}</p>
                <small>Posted by {item.admin_name || "Admin"} • {new Date(item.date_posted).toLocaleString()}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
