import { NavLink, useNavigate } from "react-router-dom";
import Icon from "./Icon";
import Logo from "./Logo";

export default function Sidebar({ role = "user" }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    navigate("/login");
  };

  const links =
    role === "admin"
      ? [
          { to: "/admin/dashboard", icon: "dashboard", label: "Dashboard" },
          { to: "/admin/users", icon: "users", label: "Users" },
          { to: "/admin/services", icon: "briefcase", label: "Services" },
          { to: "/admin/applications", icon: "clipboard", label: "Applications" },
          { to: "/admin/requirements", icon: "file", label: "Requirements" },
          { to: "/admin/vouchers", icon: "voucher", label: "Vouchers" },
          { to: "/admin/announcements", icon: "announcement", label: "Announcements" },
          { to: "/admin/support", icon: "help", label: "Support" },
          { to: "/admin/audit-logs", icon: "shield", label: "Audit Logs" },
          { to: "/admin/reports", icon: "chart", label: "Reports" }
        ]
      : [
          { to: "/user/dashboard", icon: "dashboard", label: "Dashboard" },
          { to: "/user/services", icon: "briefcase", label: "Browse Services" },
          { to: "/user/applications", icon: "clipboard", label: "My Applications" },
          { to: "/user/requests", icon: "help", label: "My Requests" },
          { to: "/user/profile", icon: "profile", label: "My Profile" },
          { to: "/announcements", icon: "announcement", label: "Announcements" }
        ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brandIcon">
          <Logo size={42} />
        </div>
        <div>
          <h2>PWDConnect PH</h2>
          <p>{role === "admin" ? "Admin Portal" : "Services Portal"}</p>
        </div>
      </div>

      <nav className="navLinks" aria-label="Primary navigation">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? "navLink active" : "navLink")}
          >
            <Icon name={link.icon} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="logoutBtn" onClick={logout}>
        <Icon name="logout" />
        <span>Sign Out</span>
      </button>
    </aside>
  );
}
