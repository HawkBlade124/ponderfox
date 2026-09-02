import { useEffect, useState } from "react";

const SCRIPT_ID = "google-identity-script";

// Loads Google Identity Services once per page and reports when
// window.google.accounts.id is ready to call. Shared by every place that
// renders a Google button (Login, and Settings' "Connect Google") so the
// script tag itself is never injected twice.
export function useGoogleIdentityScript() {
  const [ready, setReady] = useState(() => Boolean(window.google?.accounts?.id));

  useEffect(() => {
    if (window.google?.accounts?.id) {
      setReady(true);
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

    const handleLoad = () => setReady(true);
    script.addEventListener("load", handleLoad);
    return () => script.removeEventListener("load", handleLoad);
  }, []);

  return ready;
}
