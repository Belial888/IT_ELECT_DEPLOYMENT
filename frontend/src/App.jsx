import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminManage from "./pages/AdminManage";
import AdminReports from "./pages/AdminReports";
import Services from "./pages/Services";
import Applications from "./pages/Applications";
import SupportRequest from "./pages/SupportRequest";
import Announcements from "./pages/Announcements";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

export default function App() {
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const theme =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    document.documentElement.dataset.theme = theme;
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/user/dashboard"
        element={
          <ProtectedRoute role="user">
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/services"
        element={
          <ProtectedRoute role="user">
            <Services />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/applications"
        element={
          <ProtectedRoute role="user">
            <Applications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/requests"
        element={
          <ProtectedRoute role="user">
            <SupportRequest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/profile"
        element={
          <ProtectedRoute role="user">
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminManage module="users" /></ProtectedRoute>} />
      <Route path="/admin/services" element={<ProtectedRoute role="admin"><AdminManage module="services" /></ProtectedRoute>} />
      <Route path="/admin/applications" element={<ProtectedRoute role="admin"><AdminManage module="applications" /></ProtectedRoute>} />
      <Route path="/admin/requirements" element={<ProtectedRoute role="admin"><AdminManage module="requirements" /></ProtectedRoute>} />
      <Route path="/admin/vouchers" element={<ProtectedRoute role="admin"><AdminManage module="vouchers" /></ProtectedRoute>} />
      <Route path="/admin/announcements" element={<ProtectedRoute role="admin"><AdminManage module="announcements" /></ProtectedRoute>} />
      <Route path="/admin/support" element={<ProtectedRoute role="admin"><AdminManage module="support" /></ProtectedRoute>} />
      <Route path="/admin/audit-logs" element={<ProtectedRoute role="admin"><AdminManage module="audit" /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute role="admin"><AdminReports /></ProtectedRoute>} />

      <Route
        path="/announcements"
        element={
          <ProtectedRoute>
            <Announcements />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
