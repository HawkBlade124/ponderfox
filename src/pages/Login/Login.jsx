// frontend/src/pages/Login.jsx
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import AuthLayout from "../../components/AuthLayout";
import { useGoogleIdentityScript } from "../../hooks/useGoogleIdentityScript.js";

function buildApiUrl() {
  const base = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/+$/, "");
  return base.includes("/api") ? base : `${base}/api`;
}

function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const finishLogin = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    // Must match the server's actual token lifetime (30d remembered, 2h
    // otherwise — see issueLoginSuccess in server.js), or AuthContext ends
    // up scheduling an auto-logout that's wildly out of sync with when the
    // token itself actually stops working.
    const REMEMBERED_MS = 30 * 24 * 60 * 60 * 1000;
    const SESSION_MS = 2 * 60 * 60 * 1000;
    localStorage.setItem("tokenExpiry", String(Date.now() + (rememberMe ? REMEMBERED_MS : SESSION_MS)));

    setSuccess(true);
    navigate(data.user.HasOnboarded ? "/dashboard" : "/welcome");
    setTimeout(() => {
      window.location.reload();
    }, 50);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setSuccess(false);

    if (!identifier.trim() || !password.trim()) {
      setError("Username and password fields cannot be empty.");
      return;
    }
    setError("");

    const apiBase = buildApiUrl();
    try {
      const res = await axios.post(
        `${apiBase}/login`,
        { identifier: identifier.trim(), password, rememberMe },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data?.twoFactorRequired) {
        setTempToken(res.data.tempToken);
        return;
      }

      if (res.data?.success) {
        finishLogin(res.data);
        return;
      }

      setError(res.data?.message || "Unexpected API response.");
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message || err.message || "Login failed. Please try again."
      );
    }
  };

  const handleGoogleCredential = async (response) => {
    setError("");
    const apiBase = buildApiUrl();
    try {
      const res = await axios.post(
        `${apiBase}/login/google`,
        { credential: response.credential, rememberMe },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data?.twoFactorRequired) {
        setTempToken(res.data.tempToken);
        return;
      }

      if (res.data?.success) {
        finishLogin(res.data);
        return;
      }

      setError(res.data?.message || "Google sign-in failed.");
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError(err.response?.data?.message || err.message || "Google sign-in failed.");
    }
  };

  // Google Identity Services' callback is registered once with the script
  // and never re-created on our end, so it can't close over fresh state —
  // routing it through a ref that's reassigned every render is what keeps
  // it seeing the latest rememberMe/finishLogin instead of the mount-time
  // ones.
  const handleGoogleCredentialRef = useRef(handleGoogleCredential);
  handleGoogleCredentialRef.current = handleGoogleCredential;

  const googleScriptStatus = useGoogleIdentityScript();

  useEffect(() => {
    if (tempToken || googleScriptStatus !== "ready") return; // the button's container isn't mounted on the 2FA screen

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: (response) => handleGoogleCredentialRef.current(response),
    });
    const container = document.getElementById("googleSignInButton");
    if (container) {
      window.google.accounts.id.renderButton(container, {
        theme: "filled_black",
        size: "large",
        width: 336,
        text: "continue_with",
      });
    }
  }, [tempToken, googleScriptStatus]);

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    if (!twoFactorCode.trim()) return;
    setError("");
    setSubmitting(true);

    const apiBase = buildApiUrl();
    try {
      const res = await axios.post(
        `${apiBase}/login/2fa`,
        { tempToken, code: twoFactorCode.trim() },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data?.success) {
        finishLogin(res.data);
        return;
      }

      setError(res.data?.message || "Invalid code.");
    } catch (err) {
      console.error("2FA login error:", err);
      setError(err.response?.data?.message || err.message || "Invalid code.");
    } finally {
      setSubmitting(false);
    }
  };

  if (tempToken) {
    return (
      <AuthLayout headline={<>Enter your verification code</>}>
        <form className="flex flex-col gap-5" onSubmit={handleTwoFactorSubmit}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="twoFactorCode" className="text-sm font-medium text-slate-300">
              6-digit code or backup code
            </label>
            <input
              id="twoFactorCode"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="rounded-lg border border-slate-700 bg-slate-800/60 h-11 px-4 !text-white placeholder:!text-slate-500 outline-none focus:border-[#438eef] focus:ring-2 focus:ring-[#438eef]/20 transition"
              placeholder="123456"
              value={twoFactorCode}
              onChange={(e) => { setTwoFactorCode(e.target.value); setError(""); }}
              autoFocus
              required
            />
            <p className="text-xs text-slate-500">Open your authenticator app, or enter one of your backup codes.</p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="bg-[#438eef] hover:bg-[#2f7ae0] transition text-white font-semibold h-11 rounded-lg cursor-pointer disabled:opacity-60"
          >
            {submitting ? "Verifying..." : "Verify"}
          </button>

          <button
            type="button"
            className="text-center text-sm text-slate-400 hover:text-white"
            onClick={() => { setTempToken(null); setTwoFactorCode(""); setError(""); }}
          >
            Back to sign in
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      headline={
        <>
          Welcome back! Please sign in to your account
        </>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={handleLogin}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="identifier" className="text-sm font-medium text-slate-300">
            Username or Email
          </label>
          <input
            id="identifier"
            type="text"
            name="identifier"
            className="rounded-lg border border-slate-700 bg-slate-800/60 h-11 px-4 !text-white placeholder:!text-slate-500 outline-none focus:border-[#438eef] focus:ring-2 focus:ring-[#438eef]/20 transition"
            placeholder="Enter your username or email"
            value={identifier}
            onChange={(e) => { setIdentifier(e.target.value); setError(""); }}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-slate-300">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              className="rounded-lg border border-slate-700 bg-slate-800/60 h-11 px-4 pr-11 w-full !text-white placeholder:!text-slate-500 outline-none focus:border-[#438eef] focus:ring-2 focus:ring-[#438eef]/20 transition"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              required
            />
            <i
              className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"} absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 cursor-pointer`}
              onClick={() => setShowPassword((v) => !v)}
            ></i>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            name="remember"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="accent-[#438eef] w-4 h-4"
          />
          Remember me
        </label>

        <Link to="/forgot-password" className="-mt-3 text-sm text-[#438eef] hover:underline">
          Forgot your password?
        </Link>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">Login successful!</p>}

        <button
          type="submit"
          className="bg-[#438eef] hover:bg-[#2f7ae0] transition text-white font-semibold h-11 rounded-lg cursor-pointer"
        >
          Sign In
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-700"></div>
        <span className="text-xs text-slate-500">OR</span>
        <div className="flex-1 h-px bg-slate-700"></div>
      </div>

      {googleScriptStatus === "blocked" ? (
        <p className="text-center text-xs text-slate-500">
          Continue with Google is blocked by an ad blocker or privacy extension (like Brave Shields). Allow accounts.google.com to use it, or sign in with your username and password above.
        </p>
      ) : (
        <div id="googleSignInButton" className="flex justify-center"></div>
      )}

      <p className="text-center text-sm text-slate-400">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="text-[#438eef] font-semibold hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}

export default Login;
