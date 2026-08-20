import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import PasswordStrength from "../../components/PasswordStrength.jsx";
import { buildApiUrl } from "../../utils/api.js";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const token = searchParams.get("token") || "";
  const passwordsMatch = password.length > 0 && password === confirmation;
  const canSubmit = Boolean(token && password && passwordsMatch && !submitting);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!token) return setError("This reset link is missing its token.");
    if (!passwordsMatch) return setError("Passwords do not match.");
    setSubmitting(true);
    try {
      const response = await fetch(`${buildApiUrl()}/password-reset/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to reset password.");
      setCompleted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const passwordField = (id, label, value, setValue, visible, setVisible, placeholder) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-300">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => { setValue(event.target.value); setError(""); }}
          placeholder={placeholder}
          autoComplete={id === "new-password" ? "new-password" : "new-password"}
          className="rounded-lg border border-slate-700 bg-slate-800/60 h-11 px-4 pr-12 !text-white placeholder:!text-slate-500 outline-none focus:border-[#438eef] focus:ring-2 focus:ring-[#438eef]/20 transition w-full"
          required
        />
        <button
          type="button"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          title={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 text-slate-500 hover:text-white transition"
        >
          <i className={`fa-regular ${visible ? "fa-eye-slash" : "fa-eye"}`}></i>
        </button>
      </div>
    </div>
  );

  return (
    <AuthLayout headline="A fresh start for your thoughts" subtext="Choose a strong new password for your account.">
      {completed ? (
        <div className="flex flex-col gap-6" role="status" aria-live="polite">
          <div className="flex items-start gap-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
              <i className="fa-solid fa-check"></i>
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-bold text-white">Password updated</h1>
              <p className="text-sm leading-5 text-emerald-100/75">Your password has been changed. You can sign in with it now.</p>
            </div>
          </div>
          <Link to="/login" className="flex h-11 items-center justify-center rounded-lg bg-[#438eef] font-semibold text-white transition hover:bg-[#2f7ae0]">Continue to sign in</Link>
        </div>
      ) : !token ? (
        <div className="flex flex-col gap-6" role="alert">
          <div className="flex items-start gap-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-300/20 text-amber-200">
              <i className="fa-solid fa-link-slash"></i>
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-bold text-white">This link is incomplete</h1>
              <p className="text-sm leading-5 text-amber-100/75">Request a new password reset link and try again.</p>
            </div>
          </div>
          <Link to="/forgot-password" className="flex h-11 items-center justify-center rounded-lg bg-[#438eef] font-semibold text-white transition hover:bg-[#2f7ae0]">Request a new link</Link>
          <Link to="/login" className="text-center text-sm text-slate-400 transition hover:text-white">Back to sign in</Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-white">Choose a new password</h1>
            <p className="text-sm text-slate-400">Your reset link is valid for one hour.</p>
          </div>
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {passwordField("new-password", "New password", password, setPassword, showPassword, setShowPassword, "Enter a new password")}
            <PasswordStrength password={password} />
            {passwordField("confirm-password", "Confirm new password", confirmation, setConfirmation, showConfirmation, setShowConfirmation, "Re-enter your new password")}
            {confirmation && (
              <p className={`-mt-3 text-xs ${passwordsMatch ? "text-emerald-400" : "text-amber-300"}`}>
                <i className={`fa-solid ${passwordsMatch ? "fa-check" : "fa-circle-exclamation"} mr-1`}></i>
                {passwordsMatch ? "Passwords match" : "Passwords do not match"}
              </p>
            )}
            {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
            <button type="submit" disabled={!canSubmit} className="h-11 rounded-lg bg-[#438eef] font-semibold text-white transition hover:bg-[#2f7ae0] disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? "Updating password..." : "Set new password"}
            </button>
            <Link to="/login" className="text-center text-sm text-slate-400 transition hover:text-white">Back to sign in</Link>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

export default ResetPassword;