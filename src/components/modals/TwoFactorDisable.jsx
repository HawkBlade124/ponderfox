import ReactModal from "react-modal";
import { useState } from "react";
import { buildApiUrl } from "../../utils/api.js";

function TwoFactorDisableModal({ isOpen, onClose, token, onDisabled }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setPassword("");
    setError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${buildApiUrl()}/2fa/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to disable two-factor authentication");
        setSubmitting(false);
        return;
      }
      onDisabled?.();
      handleClose();
    } catch (err) {
      console.error("2FA disable error:", err);
      setError("Could not reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  };

  return (
    <ReactModal
      className="modal"
      isOpen={isOpen}
      onRequestClose={handleClose}
      ariaHideApp={false}
      contentLabel="Disable Two-Factor Authentication"
    >
      <i className="fa-solid fa-xmark modalClose" onClick={handleClose}></i>

      <div className="modalHeader">
        <div className="modalIconBadge modalIconBadgeDanger">
          <i className="fa-regular fa-shield-xmark"></i>
        </div>
        <h2 className="modalTitle">Disable two-factor authentication</h2>
        <p className="modalSubtitle">Enter your password to turn off two-factor authentication for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="modalForm">
        <div className="modalFieldGroup">
          <label className="modalFieldLabel" htmlFor="disable2faPassword">Password</label>
          <div className="passwordFieldWrapper">
            <input
              id="disable2faPassword"
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
        <button type="submit" className="modalPrimaryButton modalPrimaryButtonDanger" disabled={submitting || !password}>
          {submitting ? "Disabling..." : "Disable Two-Factor Authentication"}
        </button>
        <hr className="modalDivider" />
        <button type="button" className="modalTextLink" onClick={handleClose}>Cancel</button>
      </form>
    </ReactModal>
  );
}

export default TwoFactorDisableModal;
