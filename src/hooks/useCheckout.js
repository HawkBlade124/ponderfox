import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { buildApiUrl } from "../utils/api.js";

// Shared "choose a paid plan" behavior for the Home and Pricing pages.
// Logged-out visitors go through registration first (carrying plan intent
// via ?plan=), then Register.jsx picks the checkout back up after signup.
export function useCheckout() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState("");

  const startCheckout = async (plan) => {
    if (!plan) return;

    if (!user || !token) {
      navigate(`/register?plan=${plan}`);
      return;
    }

    setError("");
    setLoadingPlan(plan);
    try {
      const res = await fetch(`${buildApiUrl()}/billing/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Couldn't start checkout. Please try again.");
        setLoadingPlan(null);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Couldn't reach the server. Please try again.");
      setLoadingPlan(null);
    }
  };

  return { startCheckout, loadingPlan, error };
}
