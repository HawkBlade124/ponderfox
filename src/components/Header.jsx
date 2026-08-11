import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";

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
      <div className="desktopHeader flex gap-20 justify-between items-center absolute top-0 left-0 right-0 z-[100] box-border bg-white/30 backdrop-opacity-10 p-2 w-5xl m-auto rounded-b-3xl pr-5 pl-5">
        <Link to="/" className="logo">Ponderfox</Link>
        <div id="middleNav">
          <div className="userSpace max-w-3xl flex items-center gap-5 ">
            <Link to="/" className="hover:underline hover:duration-300 ">Home</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/FAQ">FAQ</Link>
            <Link to="/contact">Contact</Link>
          </div>          
          <div className="hamburger cursor-pointer">
            <div className="top-bar"></div>
            <div className="middle-bar"></div>
            <div className="bottom-bar"></div>
          </div>
        </div>
        <div id="rightSide" className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/dashboard">{user.Username}</Link>
                <span onClick={logout}>Logout</span>
              </>
            ) : (
              <>
                <Link to="/login" className="pl-4 pr-4 pt-2 pb-2 rounded-2xl text-white hover:bg-white/10 transition">Login</Link>
                <Link to="/register" className="border-slate-500 border-2 pl-4 pr-4 pt-2 pb-2 hover:bg-slate-500 hover:text-slate-400 rounded-2xl text-white">Get Started</Link>
              </>
            )}
        </div>
      </div>
      <div className="mobileHeader grid-cols-2 pt-5 pb-5">
        <Link to="/" className="logo">Ponderfox</Link>
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
