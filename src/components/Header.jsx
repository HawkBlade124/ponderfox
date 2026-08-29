import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import logo from "../assets/ponder-fox.png";
import LogoutConfirmModal from "./modals/LogoutConfirm";
function Header() {
  const { user, logout, loading } = useAuth();
  const [searchMessages, setSearchMessages] = useState('');
  const [searchResults, setSearchResults] = useState([])
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const closeMobileMenu = () =>{
    setMobileMenu(false);
  }
  const location = useLocation();

  // Transparent while at the top (so it can sit over a hero image), solid
  // once scrolled past it — otherwise light nav text has nothing behind it
  // to stay legible against once the page's own content scrolls underneath.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileMenu(false);
  }, [location]);

  // Lock the page underneath while the mobile flyout is open, so the
  // backdrop can't be scrolled behind it.
  useEffect(() => {
    if (!mobileMenu) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenu]);

  if (loading) {
    return null;
  }

  return (
    <header className="grid items-center pl-6 pr-6">
      <div
        className={`desktopHeader grid grid-cols-3 items-center fixed top-0 left-0 right-0 z-[100] box-border w-full py-6 px-10 transition-colors duration-300 ${
          scrolled ? "bg-[#001233]/90 backdrop-blur-md border-b border-white/10 shadow-[0_20px_45px_-20px_rgba(0,0,0,0.7)]" : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="userSpace flex items-center gap-8 justify-self-start">
          <Link to="/" className="text-white/80 hover:text-white text-sm font-medium transition">Home</Link>
          <Link to="/about" className="text-white/80 hover:text-white text-sm font-medium transition">About</Link>
          <Link to="/pricing" className="text-white/80 hover:text-white text-sm font-medium transition">Pricing</Link>
          <Link to="/contact" className="text-white/80 hover:text-white text-sm font-medium transition">Contact</Link>
        </div>
        <Link to="/" className="logo justify-self-center">
          <img src={logo} alt="Ponderfox Logo" className="h-20 w-auto" />
        </Link>
        <div id="rightSide" className="flex items-center gap-4 justify-self-end">
            {user ? (
              <>
                <Link to="/dashboard" className="text-white/80 hover:text-white text-sm font-medium transition">{user.Username}</Link>
                <span onClick={() => setShowLogoutConfirm(true)} className="text-white/80 hover:text-white text-sm font-medium transition cursor-pointer">Logout</span>
              </>
            ) : (
              <>
                <Link to="/login" className="text-white/80 hover:text-white text-sm font-medium transition">Login</Link>
                <Link to="/register" className="bg-white text-[#001233] rounded-full pl-4 pr-1.5 py-1.5 flex items-center gap-2 text-sm font-semibold hover:bg-[#e9eef5] transition">
                  Get Started
                  <span className="w-6 h-6 rounded-full bg-[#001233] text-white flex items-center justify-center">
                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </span>
                </Link>
              </>
            )}
        </div>
      </div>
      <div className="mobileHeader grid-cols-2 items-center bg-[#001233]/80 backdrop-blur-md border border-white/10 shadow-[0_20px_45px_-20px_rgba(0,0,0,0.7)] rounded-full px-5 py-3 m-4">
        <Link to="/" className="logo text-white font-semibold">Ponderfox</Link>
        <div className="rightSide flex justify-end">
          <div className="hamburger flex flex-col cursor-pointer" onClick={() => setMobileMenu(!mobileMenu)}>
            <div className="bars top-bar"></div>
            <div className="bars middle-bar"></div>
            <div className="bars bottom-bar"></div>
          </div>
        </div>
      </div>
      <div id="flyoutMenu" className={mobileMenu ? "flyoutMenuOpen" : ""}>
        <div className="bodyOverlay" onClick={closeMobileMenu}></div>
        <div className="mobileFlyoutPanel">
          <div className="flyoutNavHead">
            <Link to="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
              <img src={logo} alt="Ponderfox Logo" className="h-6 w-auto" />
            </Link>
            <i className="fa-regular fa-xmark cursor-pointer" onClick={closeMobileMenu}></i>
          </div>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/contact">Contact</Link>

          {user ? (
            <>
              <Link to="/dashboard">{user.Username}</Link>
              <span onClick={() => setShowLogoutConfirm(true)} className="cursor-pointer">Logout</span>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
      />
    </header>
  );
}

export default Header;
