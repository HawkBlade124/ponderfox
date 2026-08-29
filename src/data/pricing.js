// Displayed prices are marketing copy — swap in the real numbers once
// finalized. The actual amount charged always comes from the Stripe Price
// tied to each plan's lookupKey on the server (see PLAN_CONFIG in server.js),
// never from anything here.
export const PRICING_TIERS = [
  {
    title: "Free Thinker",
    price: "$0",
    unit: "/mo",
    blurb: "For you to get the feel of thinking freely",
    features: ["7 thoughts, folders, and moodboards", "7 folders", "Upload Images", "2GB storage Space"],
    filled: false,
    featured: false,
    plan: null,
  },
  {
    title: "Thinker",
    price: "$5",
    unit: "/mo",
    blurb: "For regular reflection.",
    features: ["14 thoughts", "14 folders", "Upload Files", "4GB storage Space"],
    filled: true,
    featured: true,
    plan: "thinker",
  },
  {
    title: "Deep Thinker",
    price: "$10",
    unit: "/mo",
    blurb: "For power thinkers.",
    features: ["Unlimited thoughts", "Unlimited folders", "Choose your own fonts and colors to personally make it yours", "15GB Storage"],
    filled: false,
    featured: false,
    plan: "deep-thinker",
  },
];
