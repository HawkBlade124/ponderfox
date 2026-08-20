import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // assuming you already have this
import AuthLayout from "../../components/AuthLayout";
import PasswordStrength from "../../components/PasswordStrength";

function buildApiUrl() {
  const base = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/+$/, "");
  return base.includes("/api") ? base : `${base}/api`;
}

const CHECKOUT_PLANS = new Set(["thinker", "deep-thinker"]);

function Register() {
  const [FirstName, setFirstName] = useState("");
  const [LastName, setLastName] = useState("");
  const [Username, setName] = useState("");
  const [Email, setEmail] = useState("");
  const [ConfirmEmail, setConfirmEmail] = useState("");
  const [Password, setPassword] = useState("");
  const [ConfirmPassword, setConfirmPassword] = useState("");
  const [Tier] = useState("Free Thinker");
  const [Error, setError] = useState("");
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, setToken } = useAuth();

  const plan = searchParams.get("plan");
  const wantsCheckout = CHECKOUT_PLANS.has(plan);

  const registerUser = async (e) => {
    e.preventDefault();

    if (Email.trim() !== ConfirmEmail.trim()) {
      setError("Emails do not match");
      return;
    }

    if (Password !== ConfirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");

    const apiBase = buildApiUrl();
    try {
      const res = await fetch(`${apiBase}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          FirstName: FirstName.trim(),
          LastName: LastName.trim(),
          Username: Username.trim(),
          Email: Email.trim(),
          Password: Password.trim(),
          Tier
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = data.details || data.error || data.message || "Request failed";
        console.error("API Error:", errorMessage, "Status:", res.status);
        setError(errorMessage);
        return;
      }

      const loginRes = await fetch(`${apiBase}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: Email.trim(),
          password: Password.trim(),
        }),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        setError(loginData.error || "Auto-login failed");
        return;
      }

      localStorage.setItem("token", loginData.token);
      localStorage.setItem("user", JSON.stringify(loginData.user));
      setUser(loginData.user);
      setToken(loginData.token);

      if (wantsCheckout) {
        try {
          const checkoutRes = await fetch(`${apiBase}/billing/create-checkout-session`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${loginData.token}` },
            body: JSON.stringify({ plan, returnPath: `/register?plan=${encodeURIComponent(plan)}` }),
          });
          const checkoutData = await checkoutRes.json();
          if (checkoutRes.ok && checkoutData.url) {
            window.location.href = checkoutData.url;
            return;
          }
        } catch (checkoutErr) {
          console.error("Checkout redirect error:", checkoutErr);
        }
      }

      navigate(loginData.user.HasOnboarded ? "/dashboard" : "/welcome");
    } catch (err) {
      console.error("Fetch error:", err);
      setError("An error occurred. Please try again.");
    }
  };

  useEffect(() => {
    if (ConfirmEmail && Email !== ConfirmEmail) {
      setError("Emails do not match");
    } else if (ConfirmPassword && Password !== ConfirmPassword) {
      setError("Passwords do not match");
    } else {
      setError("");
    }
  }, [Email, ConfirmEmail, Password, ConfirmPassword]);

  return (
    <AuthLayout
      headline={
        <>
          Join <span className="underline decoration-white/60">Ponderfox</span> and start
          capturing your thoughts
        </>
      }
      subtext="Create a free account to save, organize, and revisit everything on your mind."
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white">Create Account</h1>
        <p className="text-sm text-slate-400">Sign up — it only takes a minute.</p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={registerUser}>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="firstName" className="text-sm font-medium text-slate-300">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={FirstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className="rounded-lg border border-slate-700 bg-slate-800/60 h-11 px-4 !text-white placeholder:!text-slate-500 outline-none focus:border-[#438eef] focus:ring-2 focus:ring-[#438eef]/20 transition"
              maxLength={100}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="lastName" className="text-sm font-medium text-slate-300">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={LastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className="rounded-lg border border-slate-700 bg-slate-800/60 h-11 px-4 !text-white placeholder:!text-slate-500 outline-none focus:border-[#438eef] focus:ring-2 focus:ring-[#438eef]/20 transition"
              maxLength={100}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="username" className="text-sm font-medium text-slate-300">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={Username}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your username"
            className="rounded-lg border border-slate-700 bg-slate-800/60 h-11 px-4 !text-white placeholder:!text-slate-500 outline-none focus:border-[#438eef] focus:ring-2 focus:ring-[#438eef]/20 transition"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-slate-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={Email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="rounded-lg border border-slate-700 bg-slate-800/60 h-11 px-4 !text-white placeholder:!text-slate-500 outline-none focus:border-[#438eef] focus:ring-2 focus:ring-[#438eef]/20 transition"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmEmail" className="text-sm font-medium text-slate-300">
            Confirm Email
          </label>
          <input
            id="confirmEmail"
            type="email"
            value={ConfirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder="Re-enter your email"
            className="rounded-lg border border-slate-700 bg-slate-800/60 h-11 px-4 !text-white placeholder:!text-slate-500 outline-none focus:border-[#438eef] focus:ring-2 focus:ring-[#438eef]/20 transition"
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
              type={show ? "text" : "password"}
              value={Password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="rounded-lg border border-slate-700 bg-slate-800/60 h-11 px-4 pr-11 w-full !text-white placeholder:!text-slate-500 outline-none focus:border-[#438eef] focus:ring-2 focus:ring-[#438eef]/20 transition"
              required
            />
            <i
              className={`fa-regular ${show ? "fa-eye-slash" : "fa-eye"} absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 cursor-pointer`}
              onClick={() => setShow((v) => !v)}
            ></i>
          </div>
          <PasswordStrength password={Password} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-300">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={show ? "text" : "password"}
              value={ConfirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="rounded-lg border border-slate-700 bg-slate-800/60 h-11 px-4 pr-11 w-full !text-white placeholder:!text-slate-500 outline-none focus:border-[#438eef] focus:ring-2 focus:ring-[#438eef]/20 transition"
              required
            />
            <i
              className={`fa-regular ${show ? "fa-eye-slash" : "fa-eye"} absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 cursor-pointer`}
              onClick={() => setShow((v) => !v)}
            ></i>
          </div>
        </div>

        {Error && <p className="text-red-400 text-sm">{Error}</p>}

        <button
          type="submit"
          className="bg-[#438eef] hover:bg-[#2f7ae0] transition text-white font-semibold h-11 rounded-lg cursor-pointer"
        >
          Sign Up
        </button>
      </form>

      <p className="text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link to="/login" className="text-[#438eef] font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default Register;
