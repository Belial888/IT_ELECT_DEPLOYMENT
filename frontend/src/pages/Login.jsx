import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Icon from "../components/Icon";
import Logo from "../components/Logo";
import ThemeToggle from "../components/ThemeToggle";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "", role: "user" });
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [verificationUser, setVerificationUser] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/login", form);
      if (res.data.requiresTwoFactor) {
        setTwoFactorToken(res.data.twoFactorToken);
        setError("");
        return;
      }

      completeLogin(res.data);
    } catch (err) {
      if (err.response?.data?.requiresEmailVerification) {
        setVerificationUser({
          username: err.response.data.username || form.username,
          email: err.response.data.email
        });
        setError(err.response.data.message || "Please verify your Gmail code before signing in.");
        return;
      }
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const completeLogin = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.user.role);
    localStorage.setItem("name", data.user.name);

    if (data.user.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/user/dashboard");
    }
  };

  const verifyTwoFactor = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/login/2fa", {
        twoFactorToken,
        code: twoFactorCode
      });
      completeLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid authenticator code");
    }
  };

  const verificationMessage = (data, fallback) => {
    const devCode = data.devVerificationCode ? ` Development code: ${data.devVerificationCode}` : "";
    return `${data.message || fallback}${devCode}`;
  };

  const verifyEmail = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/verify-email", {
        username: verificationUser.username,
        code: verificationCode
      });
      setError(res.data.message || "Email verified. You can now sign in.");
      setVerificationUser(null);
      setVerificationCode("");
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    }
  };

  const resendCode = async () => {
    try {
      const res = await api.post("/auth/resend-verification", { username: verificationUser.username });
      setError(verificationMessage(res.data, "Verification code sent."));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend verification code");
    }
  };

  return (
    <div className="authPage">
      <div className="authTheme">
        <ThemeToggle />
      </div>

      <section className="authInfo">
        <span className="badge">Inclusive Digital Access</span>
        <h1>PWDConnect PH</h1>
        <p>
          A centralized portal for PWD services, benefits, announcements,
          applications, and support assistance.
        </p>
      </section>

      <form className="authCard" onSubmit={verificationUser ? verifyEmail : twoFactorToken ? verifyTwoFactor : handleSubmit}>
        <div className="authLogo">
          <Logo size={52} />
        </div>
        <h2>{verificationUser ? "Verify Gmail" : twoFactorToken ? "Authenticator Code" : "Sign In"}</h2>
        <p>
          {verificationUser
            ? `Enter the 6-digit code sent to ${verificationUser.email || "your email"}.`
            : twoFactorToken
              ? "Enter the 6-digit code from your authenticator app."
              : "Access your account securely."}
        </p>

        {error && <div className="alert error">{error}</div>}

        {verificationUser ? (
        <>
          <label>Verification Code</label>
          <input
            inputMode="numeric"
            maxLength="6"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
            required
          />
        </>
        ) : !twoFactorToken ? (
        <>
        <label>Username</label>
        <input name="username" value={form.username} onChange={handleChange} required />

        <label>Password</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} required />

        <label>Sign in as</label>
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="user">PWD User</option>
          <option value="admin">Admin</option>
        </select>
        </>
        ) : (
        <>
          <label>Authenticator Code</label>
          <input
            inputMode="numeric"
            maxLength="6"
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
            required
          />
        </>
        )}

        <button className="primaryBtn" type="submit">
          <Icon name={verificationUser || twoFactorToken ? "shield" : "arrowRight"} />
          <span>{verificationUser ? "Verify Email" : twoFactorToken ? "Verify and Sign In" : "Sign In"}</span>
        </button>
        {verificationUser && (
          <button className="secondaryBtn fullWidthBtn" type="button" onClick={resendCode}>
            Resend Code
          </button>
        )}
        {twoFactorToken && (
          <button className="secondaryBtn fullWidthBtn" type="button" onClick={() => { setTwoFactorToken(""); setTwoFactorCode(""); }}>
            Back to Sign In
          </button>
        )}
        <p className="smallText">
          Don&apos;t have an account? <Link to="/register">Sign Up</Link>
        </p>
      </form>
    </div>
  );
}
