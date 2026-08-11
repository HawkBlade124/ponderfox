import { Link } from "react-router-dom";

function AuthLayout({ headline, subtext, children }) {
  return (
    <div className="relative min-h-screen w-full grid lg:grid-cols-2 bg-[#1d293d]">
      <Link
        to="/"
        aria-label="Back to home"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full pl-3 pr-4 py-2 transition"
      >
        <i className="fa-solid fa-arrow-left"></i>
        Home
      </Link>

      {/* LEFT: form */}
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-sm flex flex-col gap-8">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-white">
            <i className="fa-solid fa-thought-bubble text-[#438eef]"></i>
            Ponderfox
          </Link>
          {children}
        </div>
      </div>

      {/* RIGHT: promo panel */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-[#438eef] to-[#1d4ed8] items-center justify-center p-12">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10"></div>
        <div className="absolute -bottom-32 -left-10 w-80 h-80 rounded-full bg-white/10"></div>

        <div className="relative z-10 max-w-md flex flex-col items-center text-center gap-6">
          <h2 className="text-3xl font-bold text-white leading-snug">{headline}</h2>
          <p className="text-white/80 text-sm">{subtext}</p>

          <div className="mt-4 flex flex-col gap-4 w-full">
            <div className="bg-white rounded-2xl p-5 shadow-xl flex items-center gap-4 text-left">
              <div className="w-11 h-11 rounded-xl bg-[#438eef]/10 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-thought-bubble text-[#438eef] text-xl"></i>
              </div>
              <div>
                <div className="text-slate-900 font-semibold">Your Thoughts</div>
                <div className="text-slate-400 text-sm">All in one place</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-xl flex items-center gap-4 text-left">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-tags text-emerald-500 text-xl"></i>
              </div>
              <div>
                <div className="text-slate-900 font-semibold">Categories & Tags</div>
                <div className="text-slate-400 text-sm">Find anything, fast</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
