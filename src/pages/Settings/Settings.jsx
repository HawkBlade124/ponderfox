import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useState, useEffect } from "react";
import ReactModal from "react-modal";
import DashMenu from "../../components/DashMenu.jsx";
import { buildApiUrl } from "../../utils/api.js";

function getInitials(name) {
  if (!name) return "?";
  return name.trim().slice(0, 2).toUpperCase();
}

function PasswordField({ id, value, onChange, show, onToggleShow, placeholder = "••••••••", autoFocus, className = "modalFieldInput" }) {
  return (
    <div className="passwordFieldWrapper">
      <input
        id={id}
        className={`${className} passwordFieldInput`}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
      />
      <i
        className={`fa-regular ${show ? "fa-eye-slash" : "fa-eye"} passwordToggleIcon`}
        onClick={onToggleShow}
      ></i>
    </div>
  );
}

function userTierColor(tier) {
  switch (tier) {
    case "Free":
      return "#63ea94";
    case "Unlimited":
      return "#d6b25d";
    case "Unlimited Free Lifetime":
      return "#85a1c8";
    default:
      return "#ccc";
  }
}

const TABS = [
  { id: "account", label: "Account Settings", icon: "fa-regular fa-user" },
  { id: "billing", label: "Billing & Subscription", icon: "fa-regular fa-credit-card" },
  { id: "appearance", label: "Appearance", icon: "fa-regular fa-palette" },
  { id: "notifications", label: "Notifications", icon: "fa-regular fa-bell" },
  { id: "integrations", label: "Integrations", icon: "fa-regular fa-plug" },
  { id: "security", label: "Security", icon: "fa-regular fa-lock" },
];

function Settings() {
  const { user, token, loading, logout, setUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState("account");

  const [profileUsername, setProfileUsername] = useState(user?.Username ?? "");
  const [profileEmail, setProfileEmail] = useState(user?.Email ?? "");
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profilePassword, setProfilePassword] = useState("");
  const [showProfileModalPassword, setShowProfileModalPassword] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [revisitEnabled, setRevisitEnabled] = useState(user?.RevisitEnabled ?? true);
  const [revisitThresholdDays, setRevisitThresholdDays] = useState(user?.RevisitThresholdDays ?? 14);
  const [revisitSaving, setRevisitSaving] = useState(false);
  const [revisitError, setRevisitError] = useState("");
  const [revisitSaved, setRevisitSaved] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteModalPassword, setShowDeleteModalPassword] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // `user` loads asynchronously from AuthContext, so the useState initializers
  // above (evaluated on first render, before `user` resolves) lock in as
  // empty/default. Sync once real user data lands, and again after any save
  // that returns a fresh user object.
  useEffect(() => {
    if (!user) return;
    setProfileUsername(user.Username ?? "");
    setProfileEmail(user.Email ?? "");
    setRevisitEnabled(user.RevisitEnabled ?? true);
    setRevisitThresholdDays(user.RevisitThresholdDays ?? 14);
  }, [user]);

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteModalOpen(false);
    setDeletePassword("");
    setShowDeleteModalPassword(false);
    setDeleteError("");
  };

  const confirmDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError("Enter your password to confirm.");
      return;
    }

    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`${buildApiUrl()}/users/me`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || "We couldn't delete your account. Please try again.");
        return;
      }
      logout();
    } catch (err) {
      console.error("Error deleting account:", err);
      setDeleteError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setDeleting(false);
    }
  };

  const closeProfileModal = () => {
    if (profileSaving) return;
    setProfileModalOpen(false);
    setProfilePassword("");
    setShowProfileModalPassword(false);
    setProfileError("");
  };

  const openProfileModal = () => {
    setProfileError("");
    setProfileSaved(false);

    const username = profileUsername.trim();
    const email = profileEmail.trim();
    if (username.length < 3) {
      setProfileError("Username must be at least 3 characters.");
      return;
    }
    if (!email) {
      setProfileError("Email is required.");
      return;
    }

    setProfileModalOpen(true);
  };

  const confirmSaveProfile = async () => {
    if (!profilePassword) {
      setProfileError("Enter your password to confirm.");
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    try {
      const res = await fetch(`${buildApiUrl()}/me/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ Username: profileUsername.trim(), Email: profileEmail.trim(), password: profilePassword }),
      });
      const data = await res.json();
      if (!data.success) {
        setProfileError(data.error || "We couldn't save your changes. Please try again.");
        return;
      }
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setProfilePassword("");
      setProfileModalOpen(false);
      setProfileSaved(true);
    } catch (err) {
      console.error("Error saving profile:", err);
      setProfileError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async () => {
    setPasswordError("");
    setPasswordSaved(false);

    if (!currentPassword) {
      setPasswordError("Enter your current password.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch(`${buildApiUrl()}/me/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!data.success) {
        setPasswordError(data.error || "We couldn't update your password. Please try again.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowPasswordFields(false);
      setPasswordSaved(true);
    } catch (err) {
      console.error("Error updating password:", err);
      setPasswordError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const saveRevisitSettings = async () => {
    setRevisitError("");
    setRevisitSaved(false);

    const days = Number(revisitThresholdDays);
    if (revisitEnabled && (!Number.isInteger(days) || days < 1 || days > 365)) {
      setRevisitError("Please enter a number of days between 1 and 365.");
      return;
    }

    setRevisitSaving(true);
    try {
      const res = await fetch(`${buildApiUrl()}/me/revisit-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: revisitEnabled, thresholdDays: days }),
      });
      const data = await res.json();
      if (!data.success) {
        setRevisitError("We couldn't save your preferences. Please try again.");
        return;
      }
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setRevisitSaved(true);
    } catch (err) {
      console.error("Error saving revisit settings:", err);
      setRevisitError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setRevisitSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl animate-pulse">Loading your settings...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div id="dashboard" className="w-full">
      <div id="dashWrap" className="flex w-full">
        <DashMenu />
        <div className="rightScreen w-full p-6 ml">
          <div id="homeHead" className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-semibold text-white">Settings</h1>
              <p className="text-sm text-slate-400 mt-1">Manage your profile, security, and account.</p>
            </div>
            <div className="flex items-center gap-3">
              {user && (
                <div className="topProfileTile">
                  <div className="topProfileAvatar">{getInitials(user.Username)}</div>
                  <div className="topProfileInfo">
                    <div className="topProfileName">{user.Username}</div>
                    <div className="topProfileEmail">{user.Email}</div>
                  </div>
                  <i className="fa-regular fa-arrow-right-from-bracket topProfileLogout" title="Logout" onClick={logout}></i>
                </div>
              )}
            </div>
          </div>

          <div className="settingsTabBar mt-5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`settingsTab ${activeTab === tab.id ? "settingsTabActive" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <i className={tab.icon}></i>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "account" && (
            <>
              <section className="dashBody settingsProfileBanner mt-5">
                <div className="settingsAvatar">{getInitials(user.Username)}</div>
                <div className="settingsProfileMeta">
                  <div className="settingsProfileName">{user.Username}</div>
                  <div className="settingsProfileEmail">{user.Email}</div>
                </div>
                <span
                  id="tierName"
                  style={{ color: userTierColor(user.Tier), backgroundColor: `${userTierColor(user.Tier)}80` }}
                >
                  {user.Tier}
                </span>
              </section>

              <section className="dashBody mt-5">
                <div className="settingsFieldSection">
                  <h2 className="settingsSectionTitle">Profile Information</h2>
                  <p className="settingsSectionSubtitle">Update your username and email address.</p>

                  <div className="settingsFieldRow">
                    <label htmlFor="settingsUsername">Username</label>
                    <div className="settingsFieldControl">
                      <input
                        id="settingsUsername"
                        className="modalFieldInput"
                        type="text"
                        value={profileUsername}
                        onChange={(e) => setProfileUsername(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="settingsFieldRow">
                    <label htmlFor="settingsEmail">Email</label>
                    <div className="settingsFieldControl">
                      <input
                        id="settingsEmail"
                        className="modalFieldInput"
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="settingsSectionFooter">
                    <span className={`text-sm ${profileError ? "text-red-400" : "text-slate-400"}`}>
                      {profileError || (profileSaved ? "Saved" : "")}
                    </span>
                    <button className="modalPrimaryButton" style={{ width: "auto" }} onClick={openProfileModal}>
                      Save Changes
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === "security" && (
            <>
              <section className="dashBody mt-5">
                <div className="settingsFieldSection">
                  <h2 className="settingsSectionTitle">Password Management</h2>
                  <p className="settingsSectionSubtitle">Change your password to keep your account safe.</p>

                  <div className="settingsFieldRow">
                    <label htmlFor="settingsCurrentPassword">Old Password</label>
                    <div className="settingsFieldControl">
                      <PasswordField
                        id="settingsCurrentPassword"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        show={showPasswordFields}
                        onToggleShow={() => setShowPasswordFields((v) => !v)}
                      />
                    </div>
                  </div>
                  <div className="settingsFieldRow">
                    <label htmlFor="settingsNewPassword">New Password</label>
                    <div className="settingsFieldControl">
                      <PasswordField
                        id="settingsNewPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        show={showPasswordFields}
                        onToggleShow={() => setShowPasswordFields((v) => !v)}
                      />
                    </div>
                  </div>
                  <div className="settingsFieldRow">
                    <label htmlFor="settingsConfirmPassword">Confirm New Password</label>
                    <div className="settingsFieldControl">
                      <PasswordField
                        id="settingsConfirmPassword"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        show={showPasswordFields}
                        onToggleShow={() => setShowPasswordFields((v) => !v)}
                      />
                    </div>
                  </div>

                  <div className="settingsSectionFooter">
                    <span className={`text-sm ${passwordError ? "text-red-400" : "text-slate-400"}`}>
                      {passwordError || (passwordSaved ? "Saved" : "")}
                    </span>
                    <button className="modalPrimaryButton" style={{ width: "auto" }} onClick={savePassword} disabled={passwordSaving}>
                      {passwordSaving ? "Saving..." : "Update Password"}
                    </button>
                  </div>
                </div>
              </section>

              <section className="dashBody settingsSection settingsDangerZone mt-5">
                <h2 className="settingsSectionTitle settingsDangerTitle"><i className="fa-regular fa-triangle-exclamation"></i> Danger Zone</h2>
                <p className="settingsSectionSubtitle">These actions are permanent or end your current session.</p>

                <div className="settingsPreferenceRow">
                  <div>
                    <div className="settingsPreferenceLabel">Log out</div>
                    <div className="settingsPreferenceHint">End your session on this device.</div>
                  </div>
                  <button className="modalButtons modalButtonsSecondary" onClick={logout}>Log Out</button>
                </div>
                <div className="settingsPreferenceRow">
                  <div>
                    <div className="settingsPreferenceLabel">Delete account</div>
                    <div className="settingsPreferenceHint">Permanently delete your account and all thoughts.</div>
                  </div>
                  <button
                    className="modalPrimaryButton modalPrimaryButtonDanger"
                    style={{ width: "auto" }}
                    onClick={() => setDeleteModalOpen(true)}
                  >
                    Delete Account
                  </button>
                </div>
              </section>
            </>
          )}

          {activeTab === "appearance" && (
            <section className="dashBody mt-5">
              <div className="settingsFieldSection">
                <h2 className="settingsSectionTitle">Appearance</h2>
                <p className="settingsSectionSubtitle">Personalize how Ponderfox looks.</p>

                <div className="settingsPreferenceRow">
                  <div>
                    <div className="settingsPreferenceLabel">Theme</div>
                    <div className="settingsPreferenceHint">Choose how Ponderfox looks on this device.</div>
                  </div>
                  <div className="viewToggle flex items-center">
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`viewToggleBtn !w-auto px-3 gap-2 ${theme === "light" ? "viewToggleBtnActive" : ""}`}
                      title="Light theme"
                    >
                      <i className="fa-regular fa-sun"></i> Light
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`viewToggleBtn !w-auto px-3 gap-2 ${theme === "dark" ? "viewToggleBtnActive" : ""}`}
                      title="Dark theme"
                    >
                      <i className="fa-regular fa-moon"></i> Dark
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === "notifications" && (
            <section className="dashBody mt-5">
              <div className="settingsFieldSection">
                <h2 className="settingsSectionTitle">Notifications</h2>
                <p className="settingsSectionSubtitle">Control what Ponderfox emails you about.</p>

                <div className="settingsPreferenceRow">
                  <div>
                    <div className="settingsPreferenceLabel">Revisit reminders</div>
                    <div className="settingsPreferenceHint">
                      Get emailed when a Thought hasn&apos;t been opened in a while
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={revisitEnabled}
                      onChange={(e) => setRevisitEnabled(e.target.checked)}
                    />
                    <span className="text-sm text-slate-300">{revisitEnabled ? "On" : "Off"}</span>
                  </label>
                </div>

                {revisitEnabled && (
                  <div className="settingsPreferenceRow">
                    <div>
                      <div className="settingsPreferenceLabel">Remind me after</div>
                      <div className="settingsPreferenceHint">Days of inactivity before a reminder is sent</div>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={revisitThresholdDays}
                      onChange={(e) => setRevisitThresholdDays(e.target.value)}
                      className="modalFieldInput"
                      style={{ width: "6rem" }}
                    />
                  </div>
                )}

                <div className="settingsSectionFooter">
                  <span className={`text-sm ${revisitError ? "text-red-400" : "text-slate-400"}`}>
                    {revisitError || (revisitSaved ? "Saved" : "")}
                  </span>
                  <button className="modalPrimaryButton" style={{ width: "auto" }} onClick={saveRevisitSettings} disabled={revisitSaving}>
                    {revisitSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeTab !== "account" && activeTab !== "security" && activeTab !== "appearance" && activeTab !== "notifications" && (
            <section className="dashBody mt-5">
              <div className="settingsComingSoonPanel">
                <div className="settingsComingSoonIcon">
                  <i className={TABS.find((tab) => tab.id === activeTab).icon}></i>
                </div>
                <h2 className="settingsSectionTitle">{TABS.find((tab) => tab.id === activeTab).label}</h2>
                <p className="settingsSectionSubtitle">This section is coming soon.</p>
                <span className="comingSoonBadge">Coming soon</span>
              </div>
            </section>
          )}
        </div>
      </div>

      <ReactModal
        className="modal"
        isOpen={profileModalOpen}
        onRequestClose={closeProfileModal}
        ariaHideApp={false}
        contentLabel="Confirm Profile Changes"
      >
        <i className="fa-solid fa-xmark modalClose" onClick={closeProfileModal}></i>

        <div className="modalHeader">
          <div className="modalIconBadge">
            <i className="fa-regular fa-user"></i>
          </div>
          <h2 className="modalTitle">Confirm your changes</h2>
          <p className="modalSubtitle">Enter your password to save your profile changes.</p>
        </div>

        <div className="modalForm">
          <div className="modalFieldGroup">
            <label className="modalFieldLabel" htmlFor="profileConfirmPassword">Password</label>
            <PasswordField
              id="profileConfirmPassword"
              value={profilePassword}
              onChange={(e) => setProfilePassword(e.target.value)}
              show={showProfileModalPassword}
              onToggleShow={() => setShowProfileModalPassword((v) => !v)}
              autoFocus
            />
          </div>

          {profileError && <p className="text-sm text-red-400">{profileError}</p>}

          <div className="settingsSectionFooter">
            <button type="button" className="modalButtons modalButtonsSecondary" onClick={closeProfileModal} disabled={profileSaving}>
              Cancel
            </button>
            <button
              type="button"
              className="modalPrimaryButton"
              style={{ width: "auto" }}
              onClick={confirmSaveProfile}
              disabled={profileSaving}
            >
              {profileSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </ReactModal>

      <ReactModal
        className="modal"
        isOpen={deleteModalOpen}
        onRequestClose={closeDeleteModal}
        ariaHideApp={false}
        contentLabel="Delete Account"
      >
        <i className="fa-solid fa-xmark modalClose" onClick={closeDeleteModal}></i>

        <div className="modalHeader">
          <div className="modalIconBadge">
            <i className="fa-regular fa-triangle-exclamation"></i>
          </div>
          <h2 className="modalTitle">Delete your account?</h2>
          <p className="modalSubtitle">
            This permanently deletes your account and all your Thoughts. This can&apos;t be undone.
          </p>
        </div>

        <div className="modalForm">
          <div className="modalFieldGroup">
            <label className="modalFieldLabel" htmlFor="deleteAccountPassword">Enter your password to confirm</label>
            <PasswordField
              id="deleteAccountPassword"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              show={showDeleteModalPassword}
              onToggleShow={() => setShowDeleteModalPassword((v) => !v)}
              autoFocus
            />
          </div>

          {deleteError && <p className="text-sm text-red-400">{deleteError}</p>}

          <div className="settingsSectionFooter">
            <button type="button" className="modalButtons modalButtonsSecondary" onClick={closeDeleteModal} disabled={deleting}>
              Cancel
            </button>
            <button
              type="button"
              className="modalPrimaryButton modalPrimaryButtonDanger"
              style={{ width: "auto" }}
              onClick={confirmDeleteAccount}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      </ReactModal>
    </div>
  );
}

export default Settings;
