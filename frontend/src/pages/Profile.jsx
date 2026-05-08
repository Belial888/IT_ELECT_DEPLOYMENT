import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import Icon from "../components/Icon";

export default function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    disability_type: "",
    contact_info: "",
    address: "",
    email: "",
    email_verified: false,
    two_factor_enabled: false
  });
  const [twoFactorSetup, setTwoFactorSetup] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [message, setMessage] = useState("");

  const loadProfile = () => {
    api.get("/users/profile").then(res => setProfile(res.data)).catch(() => {});
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put("/users/profile", profile);
      localStorage.setItem("name", profile.name);
      setMessage("Profile updated successfully.");
    } catch {
      setMessage("Failed to update profile.");
    }
  };

  const startTwoFactorSetup = async () => {
    setMessage("");
    try {
      const res = await api.post("/auth/2fa/setup");
      setTwoFactorSetup(res.data);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to start authenticator setup.");
    }
  };

  const enableTwoFactor = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await api.post("/auth/2fa/enable", { code: twoFactorCode });
      setMessage(res.data.message || "Two-factor authentication enabled.");
      setTwoFactorSetup(null);
      setTwoFactorCode("");
      loadProfile();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to enable two-factor authentication.");
    }
  };

  const disableTwoFactor = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await api.post("/auth/2fa/disable", { code: disableCode });
      setMessage(res.data.message || "Two-factor authentication disabled.");
      setDisableCode("");
      loadProfile();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to disable two-factor authentication.");
    }
  };

  return (
    <Layout title="My Profile" subtitle="View and update your profile information.">
      <form className="panel formPanel" onSubmit={save}>
        {message && <div className="alert">{message}</div>}
        <label>Full Name</label>
        <input value={profile.name || ""} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />

        <label>Disability Type</label>
        <input value={profile.disability_type || ""} onChange={(e) => setProfile({ ...profile, disability_type: e.target.value })} />

        <label>Contact Info</label>
        <input value={profile.contact_info || ""} onChange={(e) => setProfile({ ...profile, contact_info: e.target.value })} />

        <label>Email</label>
        <input value={profile.email || ""} disabled />
        <div className="smallText">
          Status: {profile.email_verified ? "Verified" : "Not verified"}
        </div>

        <label>Address</label>
        <input value={profile.address || ""} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />

        <button className="primaryBtn">
          <Icon name="check" />
          <span>Save Changes</span>
        </button>
      </form>

      <section className="panel formPanel securityPanel">
        <div className="sectionHeader compact">
          <div>
            <h2>Two-Factor Authentication</h2>
            <p>Use an authenticator app for an extra code during sign in.</p>
          </div>
          <span className={`status ${profile.two_factor_enabled ? "active" : "pending"}`}>
            {profile.two_factor_enabled ? "Enabled" : "Disabled"}
          </span>
        </div>

        {!profile.two_factor_enabled && !twoFactorSetup && (
          <button className="primaryBtn" type="button" onClick={startTwoFactorSetup}>
            <Icon name="shield" />
            <span>Enable Authenticator</span>
          </button>
        )}

        {!profile.two_factor_enabled && twoFactorSetup && (
          <form onSubmit={enableTwoFactor}>
            <div className="twoFactorSetup">
              <img src={twoFactorSetup.qr_code} alt="Authenticator QR code" />
              <div>
                <p>Scan this QR code in Google Authenticator, Microsoft Authenticator, Authy, or another TOTP app.</p>
                <label>Manual Setup Key</label>
                <input value={twoFactorSetup.secret || ""} readOnly />
              </div>
            </div>

            <label>Authenticator Code</label>
            <input
              inputMode="numeric"
              maxLength="6"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
              required
            />
            <button className="primaryBtn" type="submit">
              <Icon name="check" />
              <span>Confirm and Enable</span>
            </button>
          </form>
        )}

        {profile.two_factor_enabled && (
          <form onSubmit={disableTwoFactor}>
            <label>Authenticator Code</label>
            <input
              inputMode="numeric"
              maxLength="6"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
              required
            />
            <button className="dangerBtn fullWidthBtn" type="submit">
              <Icon name="x" />
              <span>Disable Authenticator</span>
            </button>
          </form>
        )}
      </section>
    </Layout>
  );
}
