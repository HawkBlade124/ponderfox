// Placeholder pricing — swap in real plan details when they're finalized.
// Shared between the Home page teaser and the full Pricing page so the two
// can't drift out of sync.
export const PRICING_TIERS = [
  {
    title: "Free",
    price: "$0",
    unit: "/mo",
    blurb: "Get started thinking out loud.",
    features: ["Unlimited thoughts", "3 folders", "30-day history"],
    filled: false,
    featured: false,
  },
  {
    title: "Plus",
    price: "$6",
    unit: "/mo",
    blurb: "For regular reflection.",
    features: ["Unlimited folders", "Unlimited history", "Thought search"],
    filled: true,
    featured: true,
  },
  {
    title: "Pro",
    price: "$12",
    unit: "/mo",
    blurb: "For power journalers.",
    features: ["Everything in Plus", "Export your thoughts", "Priority support"],
    filled: false,
    featured: false,
  },
  {
    title: "Lifetime",
    price: "$149",
    unit: " once",
    blurb: "Pay once, think forever.",
    features: ["Everything in Pro", "Lifetime updates", "Early access to new features"],
    filled: false,
    featured: false,
  },
];
