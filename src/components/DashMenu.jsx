import { useAuth } from "../context/AuthContext.jsx";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getTierColor } from "../utils/tier.js";
import { buildApiUrl } from "../utils/api.js";
import { getInitials } from "../utils/user.js";
import logoMark from "../assets/ponder-fox-verticle.png";

const menuItems = [
  { to: "/dashboard", label: "Home", icon: "fa-regular fa-home" },
  { to: "/thoughts", label: "Thoughts", icon: "fa-regular fa-thought-bubble" },
  { to: "/insights", label: "Insights", icon: "fa-regular fa-chart-line" },
  { to: "/settings", label: "Settings", icon: "fa-regular fa-cog" },
];

const workspaceItems = [
  { to: "/mood-boards", label: "Mood Boards", icon: "fa-regular fa-game-board" },
  { to: "/prompts", label: "Prompts", icon: "fa-regular fa-microphone-stand" },
  { to: "/organize", label: "Organize", icon: "fa-regular fa-layer-group" },
  { to: "/goals", label: "Goals", icon: "fa-regular fa-bullseye-arrow" },
];

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}

function DashMenu() {
  const { user, token, logout } = useAuth();
  const location = useLocation();

  const [mobileMenu, setMobileMenu] = useState(false);
  const closeMobileMenu = () => {
    setMobileMenu((prev) => !prev);
  };

  const [storageBytes, setStorageBytes] = useState(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    fetch(`${buildApiUrl()}/me/storage`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) setStorageBytes(data.bytes);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [token]);

  const isActive = (to) => location.pathname.startsWith(to);

  return (
    <>
      {!mobileMenu && (
        <div className="lg:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between gap-3 px-4 py-3 bg-[#0b0e17]/95 backdrop-blur border-b border-slate-800">
          <Link to="/settings" className="flex items-center gap-2 min-w-0">
            {user && (
              <>
                <div className="sidebarAvatar">{getInitials(user.Username)}</div>
                <span className="text-white font-semibold truncate">{user.Username}</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded shrink-0"
                  style={{ color: getTierColor(user.Tier), backgroundColor: `${getTierColor(user.Tier)}80` }}
                >
                  {user.Tier}
                </span>
              </>
            )}
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setMobileMenu(true)}
              className="w-11 h-11 rounded-lg bg-slate-800/90 border border-slate-700 text-white flex items-center justify-center cursor-pointer"
              aria-label="Open menu"
            >
              <i className="fa-regular fa-bars"></i>
            </button>
          </div>
        </div>
      )}
      <div id="mobileMenu" className={`leftSidebar ${mobileMenu ? "flex" : "hidden"} lg:flex`}>
        <span className="sidebarGlow sidebarGlowBlue" aria-hidden="true"></span>
        <span className="sidebarGlow sidebarGlowCyan" aria-hidden="true"></span>

        <div className="sidebarContent">
          <div className="sidebarBrandRow flex flex-col items-start justify-between">
            <i className="fa-regular fa-xmark sidebarCollapseIcon" onClick={closeMobileMenu}></i>
            <span className="sidebarBrand flex justify-center w-full">
              <span className="sidebarBrandMark"><img src={logoMark} alt="" className="sidebarBrandMarkImg" /></span>
            </span>
          </div>

          <nav className="sidebarNav">
            <div className="sidebarSectionLabel">Menu</div>
            {menuItems.map((item) => (
              <Link key={item.to} to={item.to} className={`sidebarLink ${isActive(item.to) ? "sidebarLinkActive" : ""}`}>
                <span className="sidebarLinkIcon"><i className={item.icon}></i></span>
                <span className="sidebarLinkLabel">{item.label}</span>
              </Link>
            ))}

            <div className="sidebarSectionLabel">Workspace</div>
            {workspaceItems.map((item) => (
              <Link key={item.to} to={item.to} className={`sidebarLink ${isActive(item.to) ? "sidebarLinkActive" : ""}`}>
                <span className="sidebarLinkIcon"><i className={item.icon}></i></span>
                <span className="sidebarLinkLabel">{item.label}</span>
              </Link>
            ))}
          </nav>

          {user && (
            <div className="sidebarFooter">
              <div className="sidebarStorageInfo">
                <div className="sidebarStorageLabel"><i className="fa-regular fa-hard-drive"></i> Storage used</div>
                <div className="sidebarStorageValue">
                  {storageBytes === null ? "…" : formatBytes(storageBytes)}
                </div>
              </div>
              <i className="fa-regular fa-arrow-right-from-bracket sidebarLogoutIcon" title="Logout" onClick={logout}></i>
            </div>
          )}
        </div>
      </div>
      <div id="dashOverlay" className={`lg:hidden w-full h-full ${mobileMenu ? "block" : "hidden"}`} onClick={closeMobileMenu}></div>
    </>
  );
}

export default DashMenu;
