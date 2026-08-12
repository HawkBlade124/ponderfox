// frontend/src/pages/Login.jsx
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import AuthLayout from "../../components/AuthLayout";

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
  const navigate = useNavigate();

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
        { identifier: identifier.trim(), password },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data?.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        if (rememberMe) {
          localStorage.removeItem("tokenExpiry");
        } else {
          const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
          localStorage.setItem("tokenExpiry", String(Date.now() + ONE_WEEK_MS));
        }

        setSuccess(true);
        navigate("/dashboard");
        setTimeout(() => {
          window.location.reload();
        }, 50);
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

  return (
    <AuthLayout
      headline={
        <>
          Welcome back! Please sign in to your{" "}
          <span className="underline decoration-white/60">Ponderfox</span> account
        </>
      }
      subtext="Capture every thought, organize it your way, and find it again in seconds."
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white">Sign In</h1>
        <p className="text-sm text-slate-400">Welcome back! Please enter your details.</p>
      </div>

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

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">Login successful!</p>}

        <button
          type="submit"
          className="bg-[#438eef] hover:bg-[#2f7ae0] transition text-white font-semibold h-11 rounded-lg cursor-pointer"
        >
          Sign In
        </button>
      </form>

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
