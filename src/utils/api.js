export function buildApiUrl() {
  const raw = (import.meta.env.VITE_API_URL || window.location.origin).trim();
  const base = raw.replace(/\/+$/, "");
  const hasApi = /\/api$/.test(base);
  return hasApi ? base : `${base}/api`;
}
