import { useAuth } from "../context/AuthContext.jsx";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getTierColor } from "../utils/tier.js";

const menuItems = [
  { to: "/dashboard", label: "Home", icon: "fa-regular fa-home" },
  { to: "/thoughts", label: "Thoughts", icon: "fa-regular fa-thought-bubble" },
  { to: "/insights", label: "Insights", icon: "fa-regular fa-chart-line" },
  { to: "/settings", label: "Settings", icon: "fa-regular fa-cog" },
];

const workspaceItems = [
  { to: "/mood-boards", label: "Mood Boards", icon: "fa-regular fa-game-board" },
  { to: "/prompts", label: "Prompts", icon: "fa-regular fa-microphone-stand" },
  { to: "/categories", label: "Categories", icon: "fa-regular fa-list" },
  { to: "/tags", label: "Tags", icon: "fa-regular fa-tag" },
  { to: "/lists", label: "Lists", icon: "fa-regular fa-list-tree" },
  { to: "/goals", label: "Goals", icon: "fa-regular fa-bullseye-arrow" },
];

function getInitials(name) {
  if (!name) return "?";
  return name.trim().slice(0, 2).toUpperCase();
}

function DashMenu({ hideFooter = false, showStatsToggle = false, onStatsClick }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [mobileMenu, setMobileMenu] = useState(false);
  const closeMobileMenu = () => {
    setMobileMenu((prev) => !prev);
  };

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
            {showStatsToggle && (
              <button
                onClick={onStatsClick}
                className="w-11 h-11 rounded-lg bg-slate-800/90 border border-slate-700 text-white flex items-center justify-center cursor-pointer"
                aria-label="Show stats"
              >
                <i className="fa-regular fa-chart-simple"></i>
              </button>
            )}
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
          <div className="sidebarBrandRow">
            <span className="sidebarBrand">
              <span className="sidebarBrandMark"><i className="fa-solid fa-brain"></i></span>
              Ponderfox
            </span>
            <i className="fa-regular fa-xmark sidebarCollapseIcon lg:hidden" onClick={closeMobileMenu}></i>
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

          {user && !hideFooter && (
            <div className="sidebarFooter">
              <Link to="/settings" className="flex items-center gap-[10px] flex-1 min-w-0" style={{ textDecoration: "none" }}>
                <div className="sidebarAvatar">{getInitials(user.Username)}</div>
                <div className="sidebarFooterInfo">
                  <div className="sidebarFooterName">{user.Username}</div>
                  <div className="sidebarFooterEmail">{user.Email}</div>
                </div>
              </Link>
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
