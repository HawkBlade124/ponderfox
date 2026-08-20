import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useAccentColor } from "../../context/AccentColorContext.jsx";
import { ACCENT_PRESETS } from "../../utils/accentColors.js";
import { useState, useEffect, useRef } from "react";
import ReactModal from "react-modal";
import DashMenu from "../../components/DashMenu.jsx";
import DeleteModal from "../../components/modals/Delete.jsx";
import { buildApiUrl } from "../../utils/api.js";
import { getTierColor } from "../../utils/tier.js";
import { useCheckout } from "../../hooks/useCheckout.js";
import { PRICING_TIERS } from "../../data/pricing.js";
import { formatBytes } from "../../utils/format.js";
import PasswordStrength from "../../components/PasswordStrength.jsx";

function getInitials(name) {
  if (!name) return "?";
  return name.trim().slice(0, 2).toUpperCase();
}

function getFirstName(name) {
  return name?.trim().split(/\s+/)[0] || "there";
}

function getMemberSinceYear(dateCreated) {
  if (!dateCreated) return "";
  const year = new Date(dateCreated).getFullYear();
  return Number.isNaN(year) ? "" : year;
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

function NotificationToggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      className={`settingsToggle ${checked ? "settingsToggleOn" : ""}`}
      aria-pressed={checked}
      aria-label={`${label}: ${checked ? "On" : "Off"}`}
      onClick={() => onChange(!checked)}
    >
      <span className="settingsToggleTrack">
        <span className="settingsToggleThumb"></span>
      </span>
      <span className="settingsToggleText">{checked ? "On" : "Off"}</span>
    </button>
  );
}

const TABS = [
  { id: "account", label: "Account Settings", icon: "fa-regular fa-user" },
  { id: "billing", label: "Billing & Subscription", icon: "fa-regular fa-credit-card" },
  { id: "appearance", label: "Appearance", icon: "fa-regular fa-palette" },
  { id: "notifications", label: "Notifications", icon: "fa-regular fa-bell" },
  { id: "usage", label: "Usage", icon: "fa-regular fa-chart-simple" },
  { id: "security", label: "Security", icon: "fa-regular fa-lock" },
];

function Settings() {
  const { user, token, loading, logout, setUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { accentColor, setAccentColor } = useAccentColor();
  const [accentSaving, setAccentSaving] = useState(null);
  const [accentError, setAccentError] = useState("");

  const chooseAccentColor = async (hex) => {
    if (hex === accentColor) return;
    setAccentError("");
    setAccentSaving(hex);
    const result = await setAccentColor(hex);
    if (!result.success) {
      setAccentError(result.error || "Failed to save accent color");
    }
    setAccentSaving(null);
  };

  const { startCheckout, loadingPlan } = useCheckout();

  const [activeTab, setActiveTab] = useState("account");

  const [billing, setBilling] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  useEffect(() => {
    if (activeTab !== "billing" || !token || billing || billingLoading) return;

    setBillingLoading(true);
    setBillingError("");
    fetch(`${buildApiUrl()}/billing/summary`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBilling(data);
        } else {
          setBillingError(data.error || "Failed to load billing information");
        }
      })
      .catch((err) => {
        console.error("Error loading billing summary:", err);
        setBillingError("Couldn't reach the server. Please try again.");
      })
      .finally(() => setBillingLoading(false));
  }, [activeTab, token, billing, billingLoading]);

  const openBillingPortal = async () => {
    setPortalLoading(true);
    setBillingError("");
    try {
      const res = await fetch(`${buildApiUrl()}/billing/create-portal-session`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setBillingError(data.error || "Couldn't open the billing portal.");
        setPortalLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      console.error("Error opening billing portal:", err);
      setBillingError("Couldn't reach the server. Please try again.");
      setPortalLoading(false);
    }
  };

  const [usage, setUsage] = useState(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState("");

  useEffect(() => {
    if (activeTab !== "usage" || !token || usage || usageLoading) return;

    setUsageLoading(true);
    setUsageError("");
    fetch(`${buildApiUrl()}/me/usage`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsage(data);
        } else {
          setUsageError(data.error || "Failed to load usage data");
        }
      })
      .catch((err) => {
        console.error("Error loading usage:", err);
        setUsageError("Couldn't reach the server. Please try again.");
      })
      .finally(() => setUsageLoading(false));
  }, [activeTab, token, usage, usageLoading]);

  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [showDeleteImageModal, setShowDeleteImageModal] = useState(false);
  const [selectedImageUrls, setSelectedImageUrls] = useState(new Set());

  const confirmDeleteImage = (image) => {
    setImagesToDelete([image]);
    setShowDeleteImageModal(true);
  };

  const confirmDeleteSelectedImages = () => {
    if (!usage) return;
    const selected = usage.images.items.filter((img) => selectedImageUrls.has(img.url));
    if (selected.length === 0) return;
    setImagesToDelete(selected);
    setShowDeleteImageModal(true);
  };

  const toggleImageSelected = (url) => {
    setSelectedImageUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  const deleteImages = async () => {
    if (imagesToDelete.length === 0) return;
    const targets = imagesToDelete;
    const targetUrls = new Set(targets.map((img) => img.url));

    try {
      const res = await fetch(`${buildApiUrl()}/me/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ urls: targets.map((img) => img.url) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setUsageError(data.error || "Failed to delete image(s)");
        return;
      }

      const deletedUrls = new Set(data.deleted);
      const deletedBytes = targets
        .filter((img) => deletedUrls.has(img.url))
        .reduce((sum, img) => sum + img.bytes, 0);

      setUsage((prev) =>
        prev
          ? {
              ...prev,
              images: {
                count: prev.images.count - deletedUrls.size,
                bytes: prev.images.bytes - deletedBytes,
                items: prev.images.items.filter((img) => !deletedUrls.has(img.url)),
              },
            }
          : prev
      );
      setSelectedImageUrls((prev) => {
        const next = new Set(prev);
        for (const url of targetUrls) next.delete(url);
        return next;
      });

      if (data.failed?.length > 0) {
        setUsageError(`Couldn't delete ${data.failed.length} image(s). Please try again.`);
      }
    } catch (err) {
      console.error("Error deleting image(s):", err);
      setUsageError("Couldn't reach the server. Please try again.");
    }
  };

  const [profileUsername, setProfileUsername] = useState(user?.Username ?? "");
  const [profileFirstName, setProfileFirstName] = useState(user?.FirstName ?? "");
  const [profileLastName, setProfileLastName] = useState(user?.LastName ?? "");
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
  const [newsletterEnabled, setNewsletterEnabled] = useState(user?.NewsletterEnabled ?? false);
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(user?.WeeklyDigestEnabled ?? false);
  const [dailyDigestEnabled, setDailyDigestEnabled] = useState(user?.DailyDigestEnabled ?? false);
  const [notificationsSaving, setNotificationsSaving] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [notificationsSaved, setNotificationsSaved] = useState(false);

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
    setProfileFirstName(user.FirstName ?? "");
    setProfileLastName(user.LastName ?? "");
    setProfileEmail(user.Email ?? "");
    setRevisitEnabled(user.RevisitEnabled ?? true);
    setRevisitThresholdDays(user.RevisitThresholdDays ?? 14);
    setNewsletterEnabled(user.NewsletterEnabled ?? false);
    setWeeklyDigestEnabled(user.WeeklyDigestEnabled ?? false);
    setDailyDigestEnabled(user.DailyDigestEnabled ?? false);
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
        body: JSON.stringify({
          Username: profileUsername.trim(),
          FirstName: profileFirstName.trim(),
          LastName: profileLastName.trim(),
          Email: profileEmail.trim(),
          password: profilePassword,
        }),
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

  // `overrides` lets a change handler pass the just-clicked/typed value straight
  // through, since the corresponding setState call hasn't landed yet when this
  // fires immediately after it.
  const saveNotificationSettings = async (overrides = {}) => {
    const nextRevisitEnabled = overrides.revisitEnabled ?? revisitEnabled;
    const nextRevisitThresholdDays = overrides.revisitThresholdDays ?? revisitThresholdDays;
    const nextNewsletterEnabled = overrides.newsletterEnabled ?? newsletterEnabled;
    const nextWeeklyDigestEnabled = overrides.weeklyDigestEnabled ?? weeklyDigestEnabled;
    const nextDailyDigestEnabled = overrides.dailyDigestEnabled ?? dailyDigestEnabled;

    setNotificationsError("");
    setNotificationsSaved(false);

    const days = Number(nextRevisitThresholdDays);
    if (nextRevisitEnabled && (!Number.isInteger(days) || days < 1 || days > 365)) {
      setNotificationsError("Please enter a number of days between 1 and 365.");
      return;
    }

    setNotificationsSaving(true);
    try {
      const [revisitRes, prefsRes] = await Promise.all([
        fetch(`${buildApiUrl()}/me/revisit-settings`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ enabled: nextRevisitEnabled, thresholdDays: days }),
        }),
        fetch(`${buildApiUrl()}/me/notification-settings`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            newsletterEnabled: nextNewsletterEnabled,
            weeklyDigestEnabled: nextWeeklyDigestEnabled,
            dailyDigestEnabled: nextDailyDigestEnabled,
          }),
        }),
      ]);
      const [revisitData, prefsData] = await Promise.all([revisitRes.json(), prefsRes.json()]);

      if (!revisitData.success || !prefsData.success) {
        setNotificationsError("We couldn't save your preferences. Please try again.");
        return;
      }

      setUser(prefsData.user);
      localStorage.setItem("user", JSON.stringify(prefsData.user));
      setNotificationsSaved(true);
    } catch (err) {
      console.error("Error saving notification settings:", err);
      setNotificationsError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setNotificationsSaving(false);
    }
  };

  // Toggles save immediately; the threshold-days number input debounces so
  // it doesn't fire a request on every keystroke.
  const notificationSaveTimeout = useRef(null);
  useEffect(() => () => clearTimeout(notificationSaveTimeout.current), []);

  const scheduleNotificationSave = (overrides) => {
    clearTimeout(notificationSaveTimeout.current);
    notificationSaveTimeout.current = setTimeout(() => saveNotificationSettings(overrides), 600);
  };

  // The "Saved" toast is self-dismissing: clear it 3s after it appears.
  useEffect(() => {
    if (!notificationsSaved) return;
    const timeout = setTimeout(() => setNotificationsSaved(false), 3000);
    return () => clearTimeout(timeout);
  }, [notificationsSaved]);

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
                  <div className="settingsProfileName">Hi there, {user.FirstName?.trim() || getFirstName(user.Username)}</div>
                  <div className="settingsProfileEmail">{user.Email}</div>
                  {getMemberSinceYear(user.DateCreated) && (
                    <div className="settingsProfileMemberSince">You have been a member since {getMemberSinceYear(user.DateCreated)}</div>
                  )}
                </div>
                <span
                  id="tierName"
                  style={{ color: getTierColor(user.Tier), backgroundColor: `${getTierColor(user.Tier)}80` }}
                >
                  {user.Tier}
                </span>
              </section>

              <section className="dashBody mt-5">
                <div className="settingsFieldSection">
                  <h2 className="settingsSectionTitle">Profile Information</h2>
                  <p className="settingsSectionSubtitle">Update your name, username, and email address.</p>

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
                    <label htmlFor="settingsFirstName">First name</label>
                    <div className="settingsFieldControl">
                      <input
                        id="settingsFirstName"
                        className="modalFieldInput"
                        type="text"
                        value={profileFirstName}
                        onChange={(e) => setProfileFirstName(e.target.value)}
                        placeholder="Your first name"
                        maxLength={100}
                      />
                    </div>
                  </div>
                  <div className="settingsFieldRow">
                    <label htmlFor="settingsLastName">Last name</label>
                    <div className="settingsFieldControl">
                      <input
                        id="settingsLastName"
                        className="modalFieldInput"
                        type="text"
                        value={profileLastName}
                        onChange={(e) => setProfileLastName(e.target.value)}
                        placeholder="Your last name"
                        maxLength={100}
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
                      {newPassword && (
                        <div className="mt-2">
                          <PasswordStrength password={newPassword} />
                        </div>
                      )}
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

                <div className="settingsPreferenceRow">
                  <div>
                    <div className="settingsPreferenceLabel">Accent Color</div>
                    <div className="settingsPreferenceHint">Personalize buttons, icons, and highlights across your account.</div>
                  </div>
                  <div className="accentSwatchRow">
                    {ACCENT_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        className={`accentSwatch ${accentColor === preset.value ? "accentSwatchActive" : ""}`}
                        style={{ backgroundColor: preset.value }}
                        title={preset.name}
                        disabled={accentSaving !== null}
                        onClick={() => chooseAccentColor(preset.value)}
                      >
                        {accentSaving === preset.value ? (
                          <i className="fa-regular fa-spinner-third fa-spin"></i>
                        ) : accentColor === preset.value ? (
                          <i className="fa-solid fa-check"></i>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
                {accentError && <p className="text-red-400 text-sm">{accentError}</p>}
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
                  <NotificationToggle
                    checked={revisitEnabled}
                    onChange={(val) => {
                      setRevisitEnabled(val);
                      saveNotificationSettings({ revisitEnabled: val });
                    }}
                    label="Revisit reminders"
                  />
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
                      onChange={(e) => {
                        const val = e.target.value;
                        setRevisitThresholdDays(val);
                        scheduleNotificationSave({ revisitThresholdDays: val });
                      }}
                      className="modalFieldInput"
                      style={{ width: "6rem" }}
                    />
                  </div>
                )}

                <div className="settingsPreferenceRow">
                  <div>
                    <div className="settingsPreferenceLabel">Newsletter</div>
                    <div className="settingsPreferenceHint">Occasional product news and tips from Ponderfox</div>
                  </div>
                  <NotificationToggle
                    checked={newsletterEnabled}
                    onChange={(val) => {
                      setNewsletterEnabled(val);
                      saveNotificationSettings({ newsletterEnabled: val });
                    }}
                    label="Newsletter"
                  />
                </div>

                <div className="settingsPreferenceRow">
                  <div>
                    <div className="settingsPreferenceLabel">Weekly digest</div>
                    <div className="settingsPreferenceHint">A weekly summary of your Thoughts and account usage</div>
                  </div>
                  <NotificationToggle
                    checked={weeklyDigestEnabled}
                    onChange={(val) => {
                      setWeeklyDigestEnabled(val);
                      saveNotificationSettings({ weeklyDigestEnabled: val });
                    }}
                    label="Weekly digest"
                  />
                </div>

                <div className="settingsPreferenceRow">
                  <div>
                    <div className="settingsPreferenceLabel">Daily digest</div>
                    <div className="settingsPreferenceHint">A daily summary of your Thoughts and account usage</div>
                  </div>
                  <NotificationToggle
                    checked={dailyDigestEnabled}
                    onChange={(val) => {
                      setDailyDigestEnabled(val);
                      saveNotificationSettings({ dailyDigestEnabled: val });
                    }}
                    label="Daily digest"
                  />
                </div>

                {(notificationsSaving || notificationsError) && (
                  <div className={`text-sm mt-2 ${notificationsError ? "text-red-400" : "text-slate-400"}`}>
                    {notificationsError || "Saving…"}
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === "billing" && (
            <section className="dashBody mt-5">
              <div className="settingsFieldSection">
                <h2 className="settingsSectionTitle">Billing &amp; Subscription</h2>
                <p className="settingsSectionSubtitle">Your plan, billing address, and card on file.</p>

                {billingLoading && !billing ? (
                  <p className="text-sm text-slate-400 mt-4">Loading billing information…</p>
                ) : (
                  <>
                    <div className="settingsPreferenceRow">
                      <div>
                        <div className="settingsPreferenceLabel">Current plan</div>
                        <div className="settingsPreferenceHint">
                          {billing?.status ? `Subscription status: ${billing.status}` : "No active subscription"}
                        </div>
                      </div>
                      <span
                        id="tierName"
                        style={{ color: getTierColor(user.Tier), backgroundColor: `${getTierColor(user.Tier)}80` }}
                      >
                        {user.Tier}
                      </span>
                    </div>

                    {user.Tier === "Free Thinker" ? (
                      <div className="settingsPreferenceRow">
                        <div>
                          <div className="settingsPreferenceLabel">Upgrade</div>
                          <div className="settingsPreferenceHint">Get more folders, history, and search.</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {PRICING_TIERS.filter((tier) => tier.plan).map((tier) => (
                            <button
                              key={tier.plan}
                              type="button"
                              className="modalPrimaryButton"
                              style={{ width: "auto" }}
                              disabled={loadingPlan === tier.plan}
                              onClick={() => startCheckout(tier.plan)}
                            >
                              {loadingPlan === tier.plan ? "Redirecting…" : `Choose ${tier.title}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="settingsPreferenceRow">
                        <div>
                          <div className="settingsPreferenceLabel">Manage billing</div>
                          <div className="settingsPreferenceHint">Update your card, change plans, or cancel.</div>
                        </div>
                        <button
                          type="button"
                          className="modalPrimaryButton"
                          style={{ width: "auto" }}
                          onClick={openBillingPortal}
                          disabled={portalLoading}
                        >
                          {portalLoading ? "Opening…" : "Manage Billing"}
                        </button>
                      </div>
                    )}

                    <div className="settingsPreferenceRow">
                      <div>
                        <div className="settingsPreferenceLabel">Payment method</div>
                        <div className="settingsPreferenceHint">
                          {billing?.card
                            ? `${billing.card.brand.charAt(0).toUpperCase()}${billing.card.brand.slice(1)} •••• ${billing.card.last4} — expires ${billing.card.expMonth}/${billing.card.expYear}`
                            : "No payment method on file yet."}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {billingError && <p className="text-red-400 text-sm mt-2">{billingError}</p>}
              </div>
            </section>
          )}

          {activeTab === "usage" && (
            <section className="dashBody mt-5">
              <div className="settingsFieldSection">
                <h2 className="settingsSectionTitle">Usage</h2>
                <p className="settingsSectionSubtitle">All of your usage data, in one place.</p>

                {usageLoading && !usage ? (
                  <p className="text-sm text-slate-400 mt-4">Loading usage data…</p>
                ) : (
                  <>
                    <div className="settingsPreferenceRow">
                      <div>
                        <div className="settingsPreferenceLabel">Images</div>
                        <div className="settingsPreferenceHint">
                          {usage
                            ? `${usage.images.count} ${usage.images.count === 1 ? "image" : "images"} uploaded`
                            : "Attachments across all your thoughts"}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-slate-200">
                        {usage ? formatBytes(usage.images.bytes) : "—"}
                      </span>
                    </div>

                    {usage && (
                      <div className="usageQuotaBar">
                        <div
                          className={`usageQuotaBarFill ${usage.images.bytes / usage.quota.bytes >= 0.9 ? "usageQuotaBarFillWarning" : ""}`}
                          style={{ width: `${Math.min(100, (usage.images.bytes / usage.quota.bytes) * 100)}%` }}
                        ></div>
                      </div>
                    )}
                    {usage && (
                      <div className="text-xs text-slate-500 mt-1">
                        {formatBytes(usage.images.bytes)} of {formatBytes(usage.quota.bytes)} used ({usage.quota.tier})
                      </div>
                    )}

                    {usage && usage.images.items.length > 0 && (
                      <>
                        <div className="usageSelectionBar">
                          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                            <input
                              type="checkbox"
                              checked={selectedImageUrls.size === usage.images.items.length}
                              onChange={(e) =>
                                setSelectedImageUrls(
                                  e.target.checked ? new Set(usage.images.items.map((img) => img.url)) : new Set()
                                )
                              }
                            />
                            {selectedImageUrls.size > 0 ? `${selectedImageUrls.size} selected` : "Select all"}
                          </label>
                          {selectedImageUrls.size > 0 && (
                            <button type="button" className="usageDeleteSelectedBtn" onClick={confirmDeleteSelectedImages}>
                              <i className="fa-regular fa-trash-can"></i> Delete Selected
                            </button>
                          )}
                        </div>

                        <div className="usageImageGrid">
                          {usage.images.items.map((image) => (
                            <div key={image.key} className={`usageImageCard ${selectedImageUrls.has(image.url) ? "usageImageCardSelected" : ""}`}>
                              <input
                                type="checkbox"
                                className="usageImageCheckbox"
                                checked={selectedImageUrls.has(image.url)}
                                onChange={() => toggleImageSelected(image.url)}
                              />
                              <img src={image.url} alt="" className="usageImageThumb" />
                              <div className="usageImageMeta">
                                <span>{formatBytes(image.bytes)}</span>
                                <i
                                  className="fa-regular fa-trash-can usageImageDelete"
                                  title="Delete image"
                                  onClick={() => confirmDeleteImage(image)}
                                ></i>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}

                <p className="text-xs text-slate-500 mt-4">More usage categories are coming soon.</p>

                {usageError && <p className="text-red-400 text-sm mt-2">{usageError}</p>}
              </div>
            </section>
          )}

          <DeleteModal
            isOpen={showDeleteImageModal}
            onClose={() => setShowDeleteImageModal(false)}
            itemName={imagesToDelete.length === 1 ? "this image" : `these ${imagesToDelete.length} images`}
            title={imagesToDelete.length === 1 ? "Delete Image?" : "Delete Images?"}
            confirmLabel={imagesToDelete.length === 1 ? "Delete Image" : `Delete ${imagesToDelete.length} Images`}
            onConfirm={deleteImages}
          />

          {notificationsSaved && (
            <div className="settingsToast" role="status">
              <i className="fa-solid fa-circle-check"></i>
              Notification preferences saved
            </div>
          )}

          {activeTab !== "account" && activeTab !== "security" && activeTab !== "appearance" && activeTab !== "notifications" && activeTab !== "billing" && activeTab !== "usage" && (
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
