import { Link } from "react-router-dom";
import logo from "../assets/ponder-fox.png";

function AuthLayout({ headline, subtext, children }) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#1d293d] px-4 py-16">
      <Link
        to="/"
        aria-label="Back to home"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full pl-3 pr-4 py-2 transition"
      >
        <i className="fa-solid fa-arrow-left"></i>
        Home
      </Link>

      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <Link to="/">
            <img src={logo} alt="Ponderfox" className="h-14 w-auto" />
          </Link>
          <h2 className="text-2xl font-bold text-white leading-snug">{headline}</h2>
          <p className="text-slate-400 text-sm">{subtext}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;
