import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { buildApiUrl } from "../../utils/api.js";

function getFirstName(name) {
  return name?.trim().split(/\s+/)[0] || "there";
}

function Welcome() {
  const { user, token, loading, setUser } = useAuth();
  const navigate = useNavigate();

  const [thoughtName, setThoughtName] = useState("");
  const [thoughtDescr, setThoughtDescr] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [skipping, setSkipping] = useState(false);

  const completeOnboarding = async () => {
    const res = await fetch(`${buildApiUrl()}/me/onboarding-complete`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!thoughtName.trim() || !thoughtDescr.trim()) {
      setError("Give your Thought a name and a short description.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${buildApiUrl()}/thoughts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ThoughtName: thoughtName.trim(),
          ThoughtDescr: thoughtDescr.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.details || "We couldn't create that Thought. Please try again.");
        return;
      }

      await completeOnboarding();
      navigate(`/thought/${encodeURIComponent(thoughtName.trim())}`);
    } catch (err) {
      console.error("Error creating first thought:", err);
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setSkipping(true);
    try {
      await completeOnboarding();
      navigate("/dashboard");
    } catch (err) {
      console.error("Error skipping onboarding:", err);
      setSkipping(false);
    }
  };

  // Guards against loading /welcome directly with an already-onboarded
  // account. Checked once, the first time `user` becomes available — not on
  // every `user` change, since completeOnboarding() below also flips
  // HasOnboarded true mid-session, and re-checking then would redirect to
  // /dashboard out from under the explicit navigate() that follows it.
  const initialOnboardCheckDone = useRef(false);
  useEffect(() => {
    if (!user || initialOnboardCheckDone.current) return;
    initialOnboardCheckDone.current = true;
    if (user.HasOnboarded) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  if (loading || !user || user.HasOnboarded) return null;

  return (
    <div className="rightScreen w-full min-h-screen flex items-center justify-center p-6">
      <div className="dashBody w-full max-w-lg" style={{ padding: "40px 36px" }}>
        <div className="flex flex-col items-center text-center gap-3 mb-8">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 56,
              height: 56,
              background: "color-mix(in srgb, var(--accent) 16%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent) 40%, transparent)",
            }}
          >
            <i className="fa-solid fa-thought-bubble text-2xl" style={{ color: "var(--accent)" }}></i>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome, {getFirstName(user.FirstName || user.Username)}!</h1>
          <p className="settingsSectionSubtitle">
            Let&apos;s capture your first Thought — anything on your mind works.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="modalForm">
          <div className="modalFieldGroup">
            <label className="modalFieldLabel" htmlFor="welcomeThoughtName">Thought Name</label>
            <input
              id="welcomeThoughtName"
              className="modalFieldInput"
              type="text"
              value={thoughtName}
              onChange={(e) => setThoughtName(e.target.value)}
              placeholder="e.g. Weekend plans"
              autoFocus
            />
          </div>
          <div className="modalFieldGroup">
            <label className="modalFieldLabel" htmlFor="welcomeThoughtDescr">Description</label>
            <textarea
              id="welcomeThoughtDescr"
              className="modalFieldInput modalFieldTextarea"
              value={thoughtDescr}
              onChange={(e) => setThoughtDescr(e.target.value)}
              placeholder="What's this thought about?"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button className="modalPrimaryButton" type="submit" disabled={submitting || skipping}>
            {submitting ? "Creating…" : "Create My First Thought"}
          </button>
          <button
            type="button"
            className="modalTextLink"
            onClick={handleSkip}
            disabled={submitting || skipping}
          >
            {skipping ? "Skipping…" : "Skip for now"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Welcome;
