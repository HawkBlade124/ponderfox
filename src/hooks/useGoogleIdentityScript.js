import { useEffect, useState } from "react";

const SCRIPT_ID = "google-identity-script";
const BLOCKED_FALLBACK_MS = 4000;

// Loads Google Identity Services once per page and reports its status.
// Shared by every place that renders a Google button (Login, and Settings'
// "Connect Google") so the script tag itself is never injected twice.
//
// Privacy-focused browsers and ad/tracker-blocking extensions (Brave
// Shields, uBlock Origin, etc.) commonly block accounts.google.com/gsi/client
// outright, which shows up as net::ERR_BLOCKED_BY_CLIENT in the console.
// That usually fires the script's error event, but a silent block that
// never resolves either way is also possible, so a timeout backstops it —
// callers get "blocked" instead of hanging on "loading" forever, and can
// show a real explanation instead of a dead empty space.
export function useGoogleIdentityScript() {
  const [status, setStatus] = useState(() =>
    window.google?.accounts?.id ? "ready" : "loading"
  );

  useEffect(() => {
    if (window.google?.accounts?.id) {
      setStatus("ready");
      return;
    }

    let script = document.getElementById(SCRIPT_ID);
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const handleLoad = () => setStatus("ready");
    const handleError = () => setStatus("blocked");
    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    const fallbackTimer = setTimeout(() => {
      setStatus((prev) => (prev === "loading" ? "blocked" : prev));
    }, BLOCKED_FALLBACK_MS);

    return () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
      clearTimeout(fallbackTimer);
    };
  }, []);

  return status; // "loading" | "ready" | "blocked"
}
