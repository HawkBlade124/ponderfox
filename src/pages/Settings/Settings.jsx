import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useAccentColor } from "../../context/AccentColorContext.jsx";
import { ACCENT_PRESETS } from "../../utils/accentColors.js";
import { useFont } from "../../context/FontContext.jsx";
import { FONT_PRESETS } from "../../utils/fonts.js";
import { useState, useEffect, useRef } from "react";
import ReactModal from "react-modal";
import DashMenu from "../../components/DashMenu.jsx";
import SettingsPlanCard from "../../components/SettingsPlanCard.jsx";
import DeleteModal from "../../components/modals/Delete.jsx";
import LogoutConfirmModal from "../../components/modals/LogoutConfirm.jsx";
import TwoFactorSetupModal from "../../components/modals/TwoFactorSetup.jsx";
import TwoFactorDisableModal from "../../components/modals/TwoFactorDisable.jsx";
import TwoFactorRegenerateBackupCodesModal from "../../components/modals/TwoFactorRegenerateBackupCodes.jsx";
import GoogleUnlinkModal from "../../components/modals/GoogleUnlink.jsx";
import { useGoogleIdentityScript } from "../../hooks/useGoogleIdentityScript.js";
import { buildApiUrl } from "../../utils/api.js";
import { getTierColor } from "../../utils/tier.js";
import { useCheckout } from "../../hooks/useCheckout.js";
import { PRICING_TIERS } from "../../data/pricing.js";
import { formatBytes, formatDate, formatRelativeTime } from "../../utils/format.js";
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

  const { fontFamily, setFontFamily } = useFont();
  const [fontSaving, setFontSaving] = useState(null);
  const [fontError, setFontError] = useState("");

  const chooseFontFamily = async (value) => {
    if (value === fontFamily) return;
    setFontError("");
    setFontSaving(value);
    const result = await setFontFamily(value);
    if (!result.success) {
      setFontError(result.error || "Failed to save font");
    }
    setFontSaving(null);
  };

  const { startCheckout, changePlan, loadingPlan, error: checkoutError } = useCheckout();

  const [activeTab, setActiveTab] = useState("account");

  const [billing, setBilling] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  // Loaded as soon as we have a token (not gated to the Billing tab) since
  // the plan sidebar shows subscription status on every tab. Depends only
  // on `token` — including `billing`/`billingLoading` here would re-fire
  // this effect every time the fetch itself finishes (success OR failure),
  // turning any persistent error into an infinite retry loop.
  useEffect(() => {
    if (!token) return;

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
  }, [token]);

  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState("");

  // The single source of truth for tier/status/renewal/cancellation shown
  // on this page — always a fresh read of /api/subscription (which itself
  // reads the DB row the Stripe webhook keeps in sync), never inferred
  // from AuthContext's cached `user.Tier` or from a checkout redirect.
  const fetchSubscription = () => {
    if (!token) return;
    setSubscriptionLoading(true);
    setSubscriptionError("");
    return fetch(`${buildApiUrl()}/subscription`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSubscription(data);
        } else {
          setSubscriptionError(data.error || "Failed to load subscription");
        }
      })
      .catch((err) => {
        console.error("Error loading subscription:", err);
        setSubscriptionError("Couldn't reach the server. Please try again.");
      })
      .finally(() => setSubscriptionLoading(false));
  };

  // Loaded as soon as we have a token (not gated to the Billing tab) since
  // the plan sidebar shows subscription status on every tab. Depends only
  // on `token` for the same reason as the billing effect above — including
  // subscription/subscriptionLoading would turn a persistent failure into
  // an infinite retry loop. Later manual re-fetches go through the Refresh
  // button, which calls fetchSubscription() directly.
  useEffect(() => {
    if (!token) return;
    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
    if (activeTab !== "usage" || !token || usage) return;

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
  }, [activeTab, token, usage]);

  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [showDeleteImageModal, setShowDeleteImageModal] = useState(false);
  const [selectedImageUrls, setSelectedImageUrls] = useState(new Set());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [showTwoFactorDisable, setShowTwoFactorDisable] = useState(false);
  const [showTwoFactorRegenerate, setShowTwoFactorRegenerate] = useState(false);
  const [showGoogleUnlink, setShowGoogleUnlink] = useState(false);
  const [googleLinkError, setGoogleLinkError] = useState("");
  const [googleLinking, setGoogleLinking] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState("");
  const [revokingSessionId, setRevokingSessionId] = useState(null);

  const fetchSessions = () => {
    if (!token) return;
    setSessionsLoading(true);
    setSessionsError("");
    fetch(`${buildApiUrl()}/sessions`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSessions(data.sessions);
        } else {
          setSessionsError(data.error || "Failed to load devices");
        }
      })
      .catch((err) => {
        console.error("Error loading sessions:", err);
        setSessionsError("Couldn't reach the server. Please try again.");
      })
      .finally(() => setSessionsLoading(false));
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const revokeSession = async (sessionId) => {
    setRevokingSessionId(sessionId);
    setSessionsError("");
    try {
      const res = await fetch(`${buildApiUrl()}/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      } else {
        setSessionsError(data.error || "Failed to log out that device");
      }
    } catch (err) {
      console.error("Error revoking session:", err);
      setSessionsError("Couldn't reach the server. Please try again.");
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleGoogleLinkCredential = async (response) => {
    setGoogleLinkError("");
    setGoogleLinking(true);
    try {
      const res = await fetch(`${buildApiUrl()}/me/google/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setGoogleLinkError(data.error || "Failed to connect your Google account");
        return;
      }
      setUser((prev) => (prev ? { ...prev, GoogleID: true, GoogleEmail: data.googleEmail } : prev));
      localStorage.setItem("user", JSON.stringify({ ...user, GoogleID: true, GoogleEmail: data.googleEmail }));
    } catch (err) {
      console.error("Google link error:", err);
      setGoogleLinkError("Could not reach the server. Check your connection and try again.");
    } finally {
      setGoogleLinking(false);
    }
  };

  // Same "latest closure via ref" pattern as Login.jsx — Google's callback
  // is registered once and would otherwise keep calling a stale version of
  // this handler.
  const handleGoogleLinkCredentialRef = useRef(handleGoogleLinkCredential);
  handleGoogleLinkCredentialRef.current = handleGoogleLinkCredential;

  const googleScriptReady = useGoogleIdentityScript();

  useEffect(() => {
    if (!googleScriptReady || activeTab !== "security" || user?.GoogleID) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: (response) => handleGoogleLinkCredentialRef.current(response),
    });
    const container = document.getElementById("googleConnectButton");
    if (container) {
      window.google.accounts.id.renderButton(container, {
        theme: "filled_black",
        size: "medium",
        width: 240,
        text: "signin_with",
      });
    }
  }, [googleScriptReady, activeTab, user?.GoogleID]);

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

  const [verifySending, setVerifySending] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState("");

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
      setVerifyMessage("");
    } catch (err) {
      console.error("Error saving profile:", err);
      setProfileError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  const sendVerificationEmail = async () => {
    setVerifySending(true);
    setVerifyMessage("");
    try {
      const res = await fetch(`${buildApiUrl()}/email-verification/resend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) {
        setVerifyMessage(data.error || "We couldn't send the verification email. Please try again.");
        return;
      }
      setVerifyMessage("Verification email sent — check your inbox.");
    } catch (err) {
      console.error("Error sending verification email:", err);
      setVerifyMessage("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setVerifySending(false);
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

  // Tier displayed/gated on here always comes from the freshly-fetched
  // subscription record, not user.Tier — see fetchSubscription above.
  const subscriptionTier = subscription?.tier;
  const currentTierIndex = PRICING_TIERS.findIndex((tier) => tier.title === subscriptionTier);
  const isMaxTier = subscriptionTier === PRICING_TIERS[PRICING_TIERS.length - 1].title;
  const isFree = subscriptionTier === "Free Thinker";
  const upgradeTiers = currentTierIndex >= 0 ? PRICING_TIERS.slice(currentTierIndex + 1) : PRICING_TIERS.filter((tier) => tier.plan);

  // A free user has no subscription to modify, so picking a plan has to go
  // through Checkout to collect a card. Anyone already on a paid plan
  // already has a card on file — changePlan swaps the price on their
  // existing subscription in place instead of trying to start a second one.
  const choosePlan = (plan) => {
    if (isFree) {
      startCheckout(plan);
    } else {
      changePlan(plan, fetchSubscription);
    }
  };

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
                  <i className="fa-regular fa-arrow-right-from-bracket topProfileLogout" title="Logout" onClick={() => setShowLogoutConfirm(true)}></i>
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
            <div className="settingsCardFlex flex">
              <SettingsPlanCard
                subscription={subscription}
                subscriptionLoading={subscriptionLoading}
                subscriptionError={subscriptionError}
                onJumpToBilling={() => setActiveTab("billing")}
                choosePlan={choosePlan}
                loadingPlan={loadingPlan}
                checkoutError={checkoutError}
                openBillingPortal={openBillingPortal}
                portalLoading={portalLoading}
              />
                <div className="profileSection flex flex-col gap-5 w-full">
                  <section className="dashBody settingsProfileBanner mt-5">
                    <div className="settingsAvatar">{getInitials(user.Username)}</div>
                    <div className="settingsProfileMeta">
                      <div className="settingsProfileName">Hi there, {user.FirstName?.trim() || getFirstName(user.Username)}</div>
                      <div className="settingsProfileEmail">{user.Email}</div>
                      {getMemberSinceYear(user.DateCreated) && (
                        <div className="settingsProfileMemberSince">You have been a member since {getMemberSinceYear(user.DateCreated)}</div>
                      )}
                    </div>
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
                            onChange={(e) => { setProfileEmail(e.target.value); setVerifyMessage(""); }}
                          />
                        </div>
                      </div>

                      <div className="settingsPreferenceRow">
                        <div>
                          <div className="settingsPreferenceLabel">Email verification</div>
                          <div className="settingsPreferenceHint">
                            {user.EmailVerified
                              ? "Your email address is verified."
                              : "Verify your email address to help keep your account secure."}
                          </div>
                          {!user.EmailVerified && (
                            <div className="settingsInlineLinkRow">
                              <button
                                type="button"
                                className="settingsInlineLink"
                                onClick={sendVerificationEmail}
                                disabled={verifySending}
                              >
                                Resend verification email
                              </button>
                              {verifyMessage && <span className="settingsInlineStatus">{verifyMessage}</span>}
                            </div>
                          )}
                        </div>
                        {user.EmailVerified ? (
                          <button type="button" className="modalPrimaryButton" style={{ width: "auto" }} disabled>
                            <i className="fa-solid fa-check mr-2"></i>Verified
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="modalPrimaryButton"
                            style={{ width: "auto" }}
                            onClick={sendVerificationEmail}
                            disabled={verifySending}
                          >
                            {verifySending ? "Sending…" : "Verify Now"}
                          </button>
                        )}
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

                  <section className="dashBody settingsSection mt-5">
                    <h2 className="settingsSectionTitle">Legal</h2>
                    <p className="settingsSectionSubtitle">Where to find our policies.</p>

                    <div className="settingsPreferenceRow">
                      <div>
                        <div className="settingsPreferenceLabel">Privacy Policy</div>
                        <div className="settingsPreferenceHint">What we collect and how we use it.</div>
                      </div>
                      <Link to="/privacy" className="modalButtons modalButtonsSecondary">View</Link>
                    </div>
                    <div className="settingsPreferenceRow">
                      <div>
                        <div className="settingsPreferenceLabel">Terms of Use</div>
                        <div className="settingsPreferenceHint">The rules for using Ponderfox.</div>
                      </div>
                      <Link to="/terms" className="modalButtons modalButtonsSecondary">View</Link>
                    </div>
                  </section>
                </div>
              </div>
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

              <section className="dashBody mt-5">
                <div className="settingsFieldSection">
                  <h2 className="settingsSectionTitle">Two-Factor Authentication</h2>
                  <p className="settingsSectionSubtitle">Require a code from an authenticator app when signing in, on top of your password.</p>

                  <div className="settingsPreferenceRow">
                    <div>
                      <div className="settingsPreferenceLabel">
                        {user.TwoFactorEnabled ? "Two-factor authentication is on" : "Two-factor authentication is off"}
                      </div>
                      <div className="settingsPreferenceHint">
                        {user.TwoFactorEnabled
                          ? "You'll need a code from your authenticator app each time you sign in."
                          : "Add an extra layer of security to your account."}
                      </div>
                    </div>
                    {user.TwoFactorEnabled ? (
                      <button className="modalButtons modalButtonsSecondary" onClick={() => setShowTwoFactorDisable(true)}>Disable</button>
                    ) : (
                      <button className="modalPrimaryButton" style={{ width: "auto" }} onClick={() => setShowTwoFactorSetup(true)}>Enable</button>
                    )}
                  </div>

                  {user.TwoFactorEnabled && (
                    <div className="settingsPreferenceRow">
                      <div>
                        <div className="settingsPreferenceLabel">Backup codes</div>
                        <div className="settingsPreferenceHint">Generate a new set if you're running low or think your old ones leaked.</div>
                      </div>
                      <button className="modalButtons modalButtonsSecondary" onClick={() => setShowTwoFactorRegenerate(true)}>Regenerate</button>
                    </div>
                  )}
                </div>
              </section>

              <section className="dashBody mt-5">
                <div className="settingsFieldSection">
                  <h2 className="settingsSectionTitle">Connected Accounts</h2>
                  <p className="settingsSectionSubtitle">Sign in faster by connecting a Google account.</p>

                  <div className="settingsPreferenceRow">
                    <div>
                      <div className="settingsPreferenceLabel">
                        <i className="fa-brands fa-google mr-2"></i>
                        {user.GoogleID ? "Google connected" : "Google"}
                      </div>
                      <div className="settingsPreferenceHint">
                        {user.GoogleID
                          ? (user.GoogleEmail ? `Connected as ${user.GoogleEmail}` : "Reconnect to refresh the linked email address.")
                          : "Connect your Google account to sign in with one click."}
                      </div>
                    </div>
                    {user.GoogleID ? (
                      <button className="modalButtons modalButtonsSecondary" onClick={() => setShowGoogleUnlink(true)}>Disconnect</button>
                    ) : (
                      <div id="googleConnectButton">{googleLinking && <p className="modalEmptyNote">Connecting...</p>}</div>
                    )}
                  </div>
                  {googleLinkError && <p className="text-red-400 text-sm">{googleLinkError}</p>}
                </div>
              </section>
              <section className="dashBody mt-5">
                <div className="settingsFieldSection">
                  <h2 className="settingsSectionTitle">Device Management</h2>
                  <p className="settingsSectionSubtitle">Everywhere you're currently signed in. Log out any device you don't recognize.</p>

                  {sessionsError && <p className="text-red-400 text-sm">{sessionsError}</p>}

                  {sessionsLoading ? (
                    <p className="modalEmptyNote mt-2">Loading devices…</p>
                  ) : sessions.length === 0 ? (
                    <p className="modalEmptyNote mt-2">No active sessions found.</p>
                  ) : (
                    <div className="adminTableWrap">
                      <table className="adminTable">
                        <thead>
                          <tr>
                            <th>Device</th>
                            <th>Date Logged In</th>
                            <th>IP Address</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.map((session) => (
                            <tr key={session.sessionId}>
                              <td>
                                {session.device}
                                {session.isCurrent && <span className="modalChip ml-2">This device</span>}
                              </td>
                              <td>{formatRelativeTime(session.dateLoggedIn)}</td>
                              <td>{session.ipAddress}</td>
                              <td>
                                {session.isCurrent ? (
                                  <span className="modalEmptyNote">Current session</span>
                                ) : (
                                  <button
                                    className="adminTableOpButton"
                                    disabled={revokingSessionId === session.sessionId}
                                    onClick={() => revokeSession(session.sessionId)}
                                  >
                                    {revokingSessionId === session.sessionId ? "Logging out..." : "Log Out"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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
                  <button className="modalButtons modalButtonsSecondary" onClick={() => setShowLogoutConfirm(true)}>Log Out</button>
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

                <div className="settingsPreferenceRow">
                  <div>
                    <div className="settingsPreferenceLabel">Font</div>
                    <div className="settingsPreferenceHint">Choose the typeface Ponderfox uses across your account.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="sortSelect"
                      value={fontFamily}
                      disabled={fontSaving !== null}
                      onChange={(e) => chooseFontFamily(e.target.value)}
                    >
                      {FONT_PRESETS.map((preset) => (
                        <option key={preset.value} value={preset.value} style={{ fontFamily: preset.value }}>
                          {preset.name}
                        </option>
                      ))}
                    </select>
                    {fontSaving !== null && <i className="fa-regular fa-spinner-third fa-spin text-slate-400"></i>}
                  </div>
                </div>
                {fontError && <p className="text-red-400 text-sm">{fontError}</p>}
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
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="settingsSectionTitle">Billing &amp; Subscription</h2>
                    <p className="settingsSectionSubtitle">Your plan, billing address, and card on file.</p>
                  </div>
                  <button
                    type="button"
                    className="modalButtons modalButtonsSecondary"
                    style={{ width: "auto" }}
                    onClick={fetchSubscription}
                    disabled={subscriptionLoading}
                    title="Re-fetch your subscription from the server"
                  >
                    <i className={`fa-regular fa-arrows-rotate ${subscriptionLoading ? "fa-spin" : ""}`}></i> Refresh
                  </button>
                </div>

                {subscriptionLoading && !subscription ? (
                  <p className="text-sm text-slate-400 mt-4">Loading subscription information…</p>
                ) : (
                  <>
                    <div className="settingsPreferenceRow">
                      <div>
                        <div className="settingsPreferenceLabel">Current plan</div>
                        <div className="settingsPreferenceHint">
                          {subscription?.status ? `Subscription status: ${subscription.status}` : "No active subscription"}
                        </div>
                      </div>
                      <span
                        id="tierName"
                        style={{ color: getTierColor(subscriptionTier), backgroundColor: `${getTierColor(subscriptionTier)}80` }}
                      >
                        {subscriptionTier}
                      </span>
                    </div>

                    {!isFree && subscription?.currentPeriodEnd && (
                      <div className="settingsPreferenceRow">
                        <div>
                          <div className="settingsPreferenceLabel">
                            {subscription.cancelAtPeriodEnd ? "Cancels on" : "Renews on"}
                          </div>
                          <div className="settingsPreferenceHint">
                            {subscription.cancelAtPeriodEnd
                              ? "Your plan reverts to Free Thinker after this date."
                              : "Your card will be charged automatically."}
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-slate-200">
                          {formatDate(subscription.currentPeriodEnd)}
                        </span>
                      </div>
                    )}

                    {!isMaxTier && (
                      <div className="settingsPreferenceRow">
                        <div>
                          <div className="settingsPreferenceLabel">Upgrade</div>
                          <div className="settingsPreferenceHint">Get more folders, history, and search.</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {upgradeTiers.map((tier) => (
                            <button
                              key={tier.plan}
                              type="button"
                              className="modalPrimaryButton"
                              style={{ width: "auto" }}
                              disabled={loadingPlan === tier.plan}
                              onClick={() => choosePlan(tier.plan)}
                            >
                              {loadingPlan === tier.plan
                                ? isFree
                                  ? "Redirecting…"
                                  : "Updating…"
                                : isFree
                                ? `Choose ${tier.title}`
                                : `Switch to ${tier.title}`}
                            </button>
                          ))}
                        </div>
                        {checkoutError && <p className="text-red-400 text-sm mt-2">{checkoutError}</p>}
                      </div>
                    )}

                    {!isFree && (
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
                          {billingLoading && !billing
                            ? "Loading…"
                            : billing?.card
                            ? `${billing.card.brand.charAt(0).toUpperCase()}${billing.card.brand.slice(1)} •••• ${billing.card.last4}, expires ${billing.card.expMonth}/${billing.card.expYear}`
                            : "No payment method on file yet."}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {subscriptionError && <p className="text-red-400 text-sm mt-2">{subscriptionError}</p>}
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
                        {usage ? formatBytes(usage.images.bytes) : "0 B"}
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

          <LogoutConfirmModal
            isOpen={showLogoutConfirm}
            onClose={() => setShowLogoutConfirm(false)}
            onConfirm={logout}
          />

          <TwoFactorSetupModal
            isOpen={showTwoFactorSetup}
            onClose={() => setShowTwoFactorSetup(false)}
            token={token}
            onEnabled={() => {
              setUser((prev) => (prev ? { ...prev, TwoFactorEnabled: true } : prev));
              localStorage.setItem("user", JSON.stringify({ ...user, TwoFactorEnabled: true }));
            }}
          />

          <TwoFactorDisableModal
            isOpen={showTwoFactorDisable}
            onClose={() => setShowTwoFactorDisable(false)}
            token={token}
            onDisabled={() => {
              setUser((prev) => (prev ? { ...prev, TwoFactorEnabled: false } : prev));
              localStorage.setItem("user", JSON.stringify({ ...user, TwoFactorEnabled: false }));
            }}
          />

          <TwoFactorRegenerateBackupCodesModal
            isOpen={showTwoFactorRegenerate}
            onClose={() => setShowTwoFactorRegenerate(false)}
            token={token}
          />

          <GoogleUnlinkModal
            isOpen={showGoogleUnlink}
            onClose={() => setShowGoogleUnlink(false)}
            token={token}
            onUnlinked={() => {
              setUser((prev) => (prev ? { ...prev, GoogleID: null, GoogleEmail: null } : prev));
              localStorage.setItem("user", JSON.stringify({ ...user, GoogleID: null, GoogleEmail: null }));
            }}
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
