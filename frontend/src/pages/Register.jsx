import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Icon from "../components/Icon";
import Logo from "../components/Logo";
import ThemeToggle from "../components/ThemeToggle";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    disability_type: "",
    contact_info: "",
    address: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingUser, setPendingUser] = useState(null);
const [message, setMessage] = useState("");

  const verificationMessage = (data, fallback) => {
    const devCode = data.devVerificationCode ? ` Development code: ${data.devVerificationCode}` : "";
    return `${data.message || fallback}${devCode}`;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      const res = await api.post("/auth/register", form);
      setPendingUser({ username: form.username, email: res.data.email || form.email });
      setMessage(verificationMessage(res.data, "Verification code sent. Enter it to create your account."));
    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed");
    }
  };

  const verifyEmail = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/verify-email", {
        username: pendingUser.username,
        code: verificationCode
      });
      setMessage(res.data.message || "Email verified. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Verification failed");
    }
  };

  const resendCode = async () => {
    try {
      const res = await api.post("/auth/resend-verification", { username: pendingUser.username });
      setMessage(verificationMessage(res.data, "Verification code sent."));
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to resend verification code");
    }
  };

  return (
    <div className="authPage">
      <div className="authTheme">
        <ThemeToggle />
      </div>

      <section className="authInfo">
        <span className="badge">PWD User Registration</span>
        <h1>Create your account</h1>
        <p>
          Register to apply for services, track applications, and submit support requests.
        </p>
      </section>

      {!pendingUser ? (
      <form className="authCard registerCard" onSubmit={submit}>
        <div className="authLogo">
          <Logo size={52} />
        </div>
        <h2>Sign Up</h2>
        {message && <div className="alert">{message}</div>}

        <label>Full Name</label>
        <input name="name" value={form.name} onChange={handleChange} required />

        <label>Disability Type</label>
        <input name="disability_type" value={form.disability_type} onChange={handleChange} required />

        <label>Contact Info</label>
        <input name="contact_info" value={form.contact_info} onChange={handleChange} required />

        <label>Gmail / Email</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required />

        <label>Address</label>
        <input name="address" value={form.address} onChange={handleChange} />

        <label>Username</label>
        <input name="username" value={form.username} onChange={handleChange} required />

        <label>Password</label>
        <input type="password" name="password" value={form.password} onChange={handleChange} required />

        <label>Confirm Password</label>
        <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />

        <button className="primaryBtn" type="submit">
          <Icon name="plus" />
          <span>Create Account</span>
        </button>
        <p className="smallText">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </form>
      ) : (
      <form className="authCard" onSubmit={verifyEmail}>
        <div className="authLogo">
          <Logo size={52} />
        </div>
        <h2>Verify Gmail</h2>
        <p>Enter the 6-digit code sent to {pendingUser.email}.</p>
        {message && <div className="alert">{message}</div>}

        <label>Verification Code</label>
        <input
          inputMode="numeric"
          maxLength="6"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
          required
        />

        <button className="primaryBtn" type="submit">
          <Icon name="check" />
          <span>Verify Account</span>
        </button>
        <button className="secondaryBtn fullWidthBtn" type="button" onClick={resendCode}>
          Resend Code
        </button>
        <p className="smallText">
          Already verified? <Link to="/login">Sign In</Link>
        </p>
      </form>
      )}
    </div>
  );
}
