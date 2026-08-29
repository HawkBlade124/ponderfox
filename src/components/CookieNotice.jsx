import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "cookieNoticeDismissed";

function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] flex justify-center px-4 pb-4 sm:pb-6">
      <div className="flex w-full max-w-3xl flex-col items-center gap-4 rounded-2xl border border-white/10 bg-[#001233] p-5 shadow-[0_20px_45px_-20px_rgba(0,0,0,0.7)] sm:flex-row">
        <p className="text-sm text-slate-300">
          We use local storage to keep you signed in and remember your preferences. We don&apos;t use tracking cookies. See our{" "}
          <Link to="/privacy" className="text-[#5fa8f5] font-semibold hover:underline">
            Privacy Policy
          </Link>{" "}
          for details.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="w-full shrink-0 rounded-full bg-[#0466c8] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0353a4] sm:w-auto"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export default CookieNotice;
