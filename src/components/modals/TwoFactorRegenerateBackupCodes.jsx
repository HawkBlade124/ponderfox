import ReactModal from "react-modal";
import { useState } from "react";
import { buildApiUrl } from "../../utils/api.js";

function TwoFactorRegenerateBackupCodesModal({ isOpen, onClose, token }) {
  const [step, setStep] = useState("password"); // password | codes
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setStep("password");
    setPassword("");
    setError("");
    setCopied(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${buildApiUrl()}/2fa/backup-codes/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to regenerate backup codes");
        setSubmitting(false);
        return;
      }
      setBackupCodes(data.backupCodes);
      setStep("codes");
    } catch (err) {
      console.error("2FA backup code regeneration error:", err);
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <ReactModal
      className="modal"
      isOpen={isOpen}
      onRequestClose={handleClose}
      ariaHideApp={false}
      contentLabel="Regenerate Backup Codes"
    >
      <i className="fa-solid fa-xmark modalClose" onClick={handleClose}></i>

      {step === "codes" ? (
        <>
          <div className="modalHeader">
            <div className="modalIconBadge">
              <i className="fa-regular fa-shield-check"></i>
            </div>
            <h2 className="modalTitle">Your new backup codes</h2>
            <p className="modalSubtitle">
              Your old backup codes no longer work. Store these somewhere safe — they won&apos;t be shown again.
            </p>
          </div>
          <div className="modalForm">
            <div className="backupCodeGrid">
              {backupCodes.map((c) => (
                <code key={c} className="backupCodeItem">{c}</code>
              ))}
            </div>
            <button type="button" className="modalButtons modalButtonsSecondary" onClick={copyBackupCodes}>
              {copied ? "Copied!" : "Copy codes"}
            </button>
            <button type="button" className="modalPrimaryButton" onClick={handleClose}>
              I&apos;ve saved these codes
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="modalHeader">
            <div className="modalIconBadge">
              <i className="fa-regular fa-arrows-rotate"></i>
            </div>
            <h2 className="modalTitle">Regenerate backup codes</h2>
            <p className="modalSubtitle">Enter your password to generate a new set of backup codes. Your current codes will stop working.</p>
          </div>

          <form onSubmit={handleSubmit} className="modalForm">
            <div className="modalFieldGroup">
              <label className="modalFieldLabel" htmlFor="regen2faPassword">Password</label>
              <div className="passwordFieldWrapper">
                <input
                  id="regen2faPassword"
                  className="modalFieldInput passwordFieldInput"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                <i
                  className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"} passwordToggleIcon`}
                  onClick={() => setShowPassword((v) => !v)}
                ></i>
              </div>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" className="modalPrimaryButton" disabled={submitting || !password}>
              {submitting ? "Generating..." : "Regenerate Codes"}
            </button>
            <hr className="modalDivider" />
            <button type="button" className="modalTextLink" onClick={handleClose}>Cancel</button>
          </form>
        </>
      )}
    </ReactModal>
  );
}

export default TwoFactorRegenerateBackupCodesModal;
