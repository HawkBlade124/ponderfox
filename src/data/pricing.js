// Displayed prices are marketing copy — swap in the real numbers once
// finalized. The actual amount charged always comes from the Stripe Price
// tied to each plan's lookupKey on the server (see PLAN_CONFIG in server.js),
// never from anything here.
export const PRICING_TIERS = [
  {
    title: "Free Thinker",
    price: "$0",
    unit: "/mo",
    blurb: "Get started thinking out loud.",
    features: ["Unlimited thoughts", "3 folders", "30-day history"],
    filled: false,
    featured: false,
    plan: null,
  },
  {
    title: "Thinker",
    price: "$7",
    unit: "/mo",
    blurb: "For regular reflection.",
    features: ["Unlimited folders", "Unlimited history", "Thought search"],
    filled: true,
    featured: true,
    plan: "thinker",
  },
  {
    title: "Deep Thinker",
    price: "$15",
    unit: "/mo",
    blurb: "For power journalers.",
    features: ["Everything in Thinker", "Export your thoughts", "Priority support"],
    filled: false,
    featured: false,
    plan: "deep-thinker",
  },
];
