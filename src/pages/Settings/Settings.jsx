import { useAuth } from "../../context/AuthContext.jsx";
import { useState } from "react";
import DashMenu from "../../components/DashMenu.jsx";
import { buildApiUrl } from "../../utils/api.js";

function getInitials(name) {
  if (!name) return "?";
  return name.trim().slice(0, 2).toUpperCase();
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

function Settings() {
  const { user, token, loading, logout, setUser } = useAuth();

  const [revisitEnabled, setRevisitEnabled] = useState(user?.RevisitEnabled ?? true);
  const [revisitThresholdDays, setRevisitThresholdDays] = useState(user?.RevisitThresholdDays ?? 14);
  const [revisitSaving, setRevisitSaving] = useState(false);
  const [revisitError, setRevisitError] = useState("");
  const [revisitSaved, setRevisitSaved] = useState(false);

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
      const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
      storage.setItem("user", JSON.stringify(data.user));
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
          </div>

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

          <div className="settingsSectionsGrid">
            <section className="dashBody settingsSection">
              <h2 className="settingsSectionTitle"><i className="fa-regular fa-user text-[#438eef]"></i> Profile Details</h2>
              <p className="settingsSectionSubtitle">Update your username and email address.</p>

              <div className="modalFieldGroup">
                <label className="modalFieldLabel" htmlFor="settingsUsername">Username</label>
                <input id="settingsUsername" className="modalFieldInput" type="text" defaultValue={user.Username} />
              </div>
              <div className="modalFieldGroup">
                <label className="modalFieldLabel" htmlFor="settingsEmail">Email</label>
                <input id="settingsEmail" className="modalFieldInput" type="email" defaultValue={user.Email} />
              </div>

              <div className="settingsSectionFooter">
                <span className="comingSoonBadge">Coming soon</span>
                <button className="modalPrimaryButton" disabled>Save Changes</button>
              </div>
            </section>

            <section className="dashBody settingsSection">
              <h2 className="settingsSectionTitle"><i className="fa-regular fa-lock text-[#438eef]"></i> Security</h2>
              <p className="settingsSectionSubtitle">Change your password to keep your account safe.</p>

              <div className="modalFieldGroup">
                <label className="modalFieldLabel" htmlFor="settingsCurrentPassword">Current Password</label>
                <input id="settingsCurrentPassword" className="modalFieldInput" type="password" placeholder="••••••••" />
              </div>
              <div className="modalFieldGroup">
                <label className="modalFieldLabel" htmlFor="settingsNewPassword">New Password</label>
                <input id="settingsNewPassword" className="modalFieldInput" type="password" placeholder="••••••••" />
              </div>
              <div className="modalFieldGroup">
                <label className="modalFieldLabel" htmlFor="settingsConfirmPassword">Confirm New Password</label>
                <input id="settingsConfirmPassword" className="modalFieldInput" type="password" placeholder="••••••••" />
              </div>

              <div className="settingsSectionFooter">
                <span className="comingSoonBadge">Coming soon</span>
                <button className="modalPrimaryButton" disabled>Update Password</button>
              </div>
            </section>

            <section className="dashBody settingsSection settingsSectionFull">
              <h2 className="settingsSectionTitle"><i className="fa-regular fa-sliders text-[#438eef]"></i> Preferences</h2>
              <p className="settingsSectionSubtitle">Personalize how Ponderfox looks and notifies you.</p>

              <div className="settingsPreferenceRow">
                <div>
                  <div className="settingsPreferenceLabel">Appearance</div>
                  <div className="settingsPreferenceHint">Dark theme, always on</div>
                </div>
                <span className="comingSoonBadge">Coming soon</span>
              </div>
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
                <button className="modalPrimaryButton" onClick={saveRevisitSettings} disabled={revisitSaving}>
                  {revisitSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </section>

            <section className="dashBody settingsSection settingsSectionFull settingsDangerZone">
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
                <button className="modalPrimaryButton modalPrimaryButtonDanger" style={{ width: "auto" }} disabled>Delete Account</button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
