import ReactModal from "react-modal";
import { useState, useEffect } from "react";
import { buildApiUrl } from "../../utils/api.js";

function TwoFactorSetupModal({ isOpen, onClose, token, onEnabled }) {
  const [step, setStep] = useState("loading"); // loading | verify | backup-codes
  const [secret, setSecret] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStep("loading");
    setCode("");
    setError("");
    setCopied(false);

    const startSetup = async () => {
      try {
        const res = await fetch(`${buildApiUrl()}/2fa/setup`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || "Failed to start two-factor setup");
          setStep("verify");
          return;
        }
        setSecret(data.secret);
        setQrCodeDataUrl(data.qrCodeDataUrl);
        setStep("verify");
      } catch (err) {
        console.error("2FA setup error:", err);
        setError("Could not reach the server. Check your connection and try again.");
        setStep("verify");
      }
    };

    startSetup();
  }, [isOpen, token]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${buildApiUrl()}/2fa/enable`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ secret, token: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Invalid code");
        setSubmitting(false);
        return;
      }
      setBackupCodes(data.backupCodes);
      setStep("backup-codes");
      onEnabled?.();
    } catch (err) {
      console.error("2FA enable error:", err);
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
      onRequestClose={onClose}
      ariaHideApp={false}
      contentLabel="Set Up Two-Factor Authentication"
    >
      <i className="fa-solid fa-xmark modalClose" onClick={onClose}></i>

      {step === "backup-codes" ? (
        <>
          <div className="modalHeader">
            <div className="modalIconBadge">
              <i className="fa-regular fa-shield-check"></i>
            </div>
            <h2 className="modalTitle">Save your backup codes</h2>
            <p className="modalSubtitle">
              Each code works once, to sign in if you lose access to your authenticator app. Store them somewhere safe — they won&apos;t be shown again.
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
            <button type="button" className="modalPrimaryButton" onClick={onClose}>
              I&apos;ve saved these codes
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="modalHeader">
            <div className="modalIconBadge">
              <i className="fa-regular fa-shield-halved"></i>
            </div>
            <h2 className="modalTitle">Set up two-factor authentication</h2>
            <p className="modalSubtitle">Scan this QR code with an authenticator app like Google Authenticator, Authy, or 1Password.</p>
          </div>

          <form onSubmit={handleVerify} className="modalForm">
            {step === "loading" ? (
              <p className="modalEmptyNote">Generating your setup code…</p>
            ) : (
              <>
                {qrCodeDataUrl && (
                  <div className="flex justify-center">
                    <img src={qrCodeDataUrl} alt="Two-factor setup QR code" className="twoFactorQrImage" />
                  </div>
                )}
                {secret && (
                  <div className="modalFieldGroup">
                    <label className="modalFieldLabel">Can&apos;t scan it? Enter this code manually</label>
                    <code className="twoFactorManualSecret">{secret}</code>
                  </div>
                )}
                <div className="modalFieldGroup">
                  <label className="modalFieldLabel" htmlFor="twoFactorCode">6-digit code</label>
                  <input
                    id="twoFactorCode"
                    className="modalFieldInput"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    autoFocus
                  />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button type="submit" className="modalPrimaryButton" disabled={submitting || code.trim().length < 6}>
                  {submitting ? "Verifying..." : "Verify & Enable"}
                </button>
              </>
            )}
            <hr className="modalDivider" />
            <button type="button" className="modalTextLink" onClick={onClose}>Cancel</button>
          </form>
        </>
      )}
    </ReactModal>
  );
}

export default TwoFactorSetupModal;
