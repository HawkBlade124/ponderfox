import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import { useAuth } from "../../context/AuthContext";
import { buildApiUrl } from "../../utils/api.js";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const { token: authToken, refreshUser } = useAuth();
  const [status, setStatus] = useState(token ? "verifying" : "missing");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${buildApiUrl()}/email-verification/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok || !data.success) {
          setError(data.error || "This verification link is invalid or has expired.");
          setStatus("error");
          return;
        }

        setStatus("success");
      } catch {
        if (cancelled) return;
        setError("We couldn't reach the server. Check your connection and try again.");
        setStatus("error");
      }
    })();

    return () => { cancelled = true; };
  }, [token]);

  // Separate from the confirm effect above (which only ever runs once, on
  // the URL's fixed token) so this always sees a fresh `refreshUser` bound
  // to the auth token AuthContext has actually finished loading from
  // localStorage by now — not whatever it was on the very first render.
  useEffect(() => {
    if (status === "success" && authToken) refreshUser();
  }, [status, authToken]);

  return (
    <AuthLayout headline="Confirm it's really you" subtext="Verifying your email helps keep your Ponderfox account secure.">
      {status === "verifying" && (
        <div className="flex flex-col items-center gap-4 py-6" role="status" aria-live="polite">
          <i className="fa-solid fa-spinner fa-spin text-2xl text-[#438eef]"></i>
          <p className="text-sm text-slate-400">Verifying your email…</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col gap-6" role="status" aria-live="polite">
          <div className="flex items-start gap-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
              <i className="fa-solid fa-check"></i>
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-bold text-white">Email verified</h1>
              <p className="text-sm leading-5 text-emerald-100/75">Your email address has been confirmed.</p>
            </div>
          </div>
          <Link
            to={authToken ? "/settings" : "/login"}
            className="flex h-11 items-center justify-center rounded-lg bg-[#438eef] font-semibold text-white transition hover:bg-[#2f7ae0]"
          >
            {authToken ? "Back to Settings" : "Continue to sign in"}
          </Link>
        </div>
      )}

      {(status === "error" || status === "missing") && (
        <div className="flex flex-col gap-6" role="alert">
          <div className="flex items-start gap-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-300/20 text-amber-200">
              <i className="fa-solid fa-link-slash"></i>
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-bold text-white">
                {status === "missing" ? "This link is incomplete" : "Verification failed"}
              </h1>
              <p className="text-sm leading-5 text-amber-100/75">
                {status === "missing" ? "This verification link is missing its token." : error}
              </p>
            </div>
          </div>
          <Link
            to={authToken ? "/settings" : "/login"}
            className="flex h-11 items-center justify-center rounded-lg bg-[#438eef] font-semibold text-white transition hover:bg-[#2f7ae0]"
          >
            {authToken ? "Go to Settings to resend" : "Back to sign in"}
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}

export default VerifyEmail;
