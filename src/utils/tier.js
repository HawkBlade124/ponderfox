export function getTierColor(tier) {
  switch (tier) {
    case "Free Thinker":
      return "#63ea94";
    case "Thinker":
      return "#438eef";
    case "Deep Thinker":
      return "#d6b25d";
    default:
      return "#ccc";
  }
}
