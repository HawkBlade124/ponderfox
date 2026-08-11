import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import logo from "../assets/ponder-fox.png";
function Header() {
  const { user, logout, loading } = useAuth();
  const [searchMessages, setSearchMessages] = useState('');
  const [searchResults, setSearchResults] = useState([])
  const [mobileMenu, setMobileMenu] = useState(false);

  const closeMobileMenu = () =>{
    setMobileMenu(false);
  }
  const location = useLocation();

  useEffect(() => {
    setMobileMenu(false);
  }, [location]);
  if (loading) {
    return null;
  }

  return (
    <header className="grid items-center pl-6 pr-6">
      <div className="desktopHeader flex gap-10 justify-between items-center absolute top-6 left-0 right-0 z-[100] box-border bg-[#001233]/80 backdrop-blur-md border border-white/10 shadow-[0_20px_45px_-20px_rgba(0,0,0,0.7)] py-3 pr-3 pl-6 w-[92%] max-w-7xl m-auto rounded-full">
        <Link to="/" className="logo shrink-0">
          <img src={logo} alt="Ponderfox Logo" className="h-7 w-auto" />
        </Link>
        <div id="middleNav">
          <div className="userSpace max-w-3xl flex items-center gap-8">
            <Link to="/" className="text-white/80 hover:text-white text-sm font-medium transition">Home</Link>
            <Link to="/pricing" className="text-white/80 hover:text-white text-sm font-medium transition">Pricing</Link>
            <Link to="/FAQ" className="text-white/80 hover:text-white text-sm font-medium transition">FAQ</Link>
            <Link to="/contact" className="text-white/80 hover:text-white text-sm font-medium transition">Contact</Link>
          </div>
          <div className="hamburger cursor-pointer">
            <div className="top-bar"></div>
            <div className="middle-bar"></div>
            <div className="bottom-bar"></div>
          </div>
        </div>
        <div id="rightSide" className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-white/80 hover:text-white text-sm font-medium transition">{user.Username}</Link>
                <span onClick={logout} className="text-white/80 hover:text-white text-sm font-medium transition cursor-pointer">Logout</span>
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
          {mobileMenu && 
          <div id="flyoutMenu" className="flex">
            <div className="bodyOverlay w-full h-full absolute right-0 top-0" onClick={closeMobileMenu}></div>
            <div className="userSpace max-w-3xl flex items-center">
              <div className="flyoutNavHead text-xl"><i className="fa-regular fa-xmark" onClick={closeMobileMenu}></i></div>
              <div className="w-full">
              <Link to="/">Home</Link>
              <Link to="/pricing">Pricing</Link>
              <Link to="/contact">Contact</Link>

              {user ? (
                <>
                  <Link to="/dashboard">{user.Username}</Link>
                  <span onClick={logout}>Logout</span>
                </>
              ) : (
                <>
                  <Link to="/login">Login</Link>
                  <Link to="/register">Register</Link>
                </>
              )}
              </div>
            </div>
            </div>
            }
        </div>      
      </div>
    </header>
  );
}

export default Header;
