export function getTierColor(tier) {
  switch (tier) {
    case "Free":
      return "#63ea94";
    case "Unlimited":
      return "#d6b25d";
    case "Unlimited Free Lifetime":
      return "#85a1c8";
    default:
      return "#ccc";
  }
}
