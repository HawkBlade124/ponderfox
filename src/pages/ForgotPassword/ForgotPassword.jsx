import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import { buildApiUrl } from "../../utils/api.js";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch(`${buildApiUrl()}/password-reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("Unable to send reset email.");
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout headline="Get back to your Ponderfox account" subtext="We will send a secure link to reset your password.">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white">Reset your password</h1>
        <p className="text-sm text-slate-400">Enter the email address on your account.</p>
      </div>
      {sent ? (
        <div className="flex flex-col gap-5">
          <p className="text-sm text-green-400">If an account exists for that email, a reset link is on its way.</p>
          <Link to="/login" className="text-center text-sm text-[#438eef] font-semibold hover:underline">Back to sign in</Link>
        </div>
      ) : (
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <input aria-label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="rounded-lg border border-slate-700 bg-slate-800/60 h-11 px-4 !text-white placeholder:!text-slate-500 outline-none focus:border-[#438eef] focus:ring-2 focus:ring-[#438eef]/20 transition" required />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={submitting} className="bg-[#438eef] hover:bg-[#2f7ae0] disabled:opacity-60 transition text-white font-semibold h-11 rounded-lg cursor-pointer">{submitting ? "Sending..." : "Send reset link"}</button>
          <Link to="/login" className="text-center text-sm text-slate-400 hover:text-white">Back to sign in</Link>
        </form>
      )}
    </AuthLayout>
  );
}

export default ForgotPassword;