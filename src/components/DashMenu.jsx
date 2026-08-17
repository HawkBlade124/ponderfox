import { useAuth } from "../context/AuthContext.jsx";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getTierColor } from "../utils/tier.js";
import { buildApiUrl } from "../utils/api.js";
import { getInitials } from "../utils/user.js";
import { formatBytes } from "../utils/format.js";
import logoMark from "../assets/ponder-fox-verticle.png";

const menuItems = [
  { to: "/dashboard", label: "Dashboard", icon: "fa-regular fa-home" },
];

const pinnedItems = [
  { to: "/insights", label: "Insights", icon: "fa-regular fa-chart-line" },
  { to: "/settings", label: "Settings", icon: "fa-regular fa-cog" },
];

const navGroups = [
  {
    id: "think",
    label: "Think",
    icon: "fa-regular fa-brain",
    children: [
      { pathname: "/thoughts", to: "/thoughts", tab: null, label: "Thoughts", icon: "fa-regular fa-thought-bubble" },
      { pathname: "/prompts", to: "/prompts", tab: null, label: "Prompts", icon: "fa-regular fa-microphone-stand" },
      { pathname: "/mood-boards", to: "/mood-boards", tab: null, label: "Mood Boards", icon: "fa-regular fa-game-board" },
    ],
  },
  {
    id: "organize",
    label: "Organize",
    icon: "fa-regular fa-layer-group",
    children: [
      { pathname: "/organize", to: "/organize?tab=category", tab: "category", label: "Categories", icon: "fa-regular fa-list" },
      { pathname: "/organize", to: "/organize?tab=tag", tab: "tag", label: "Tags", icon: "fa-regular fa-tag" },
      { pathname: "/organize", to: "/organize", tab: null, label: "Lists", icon: "fa-regular fa-list-tree" },
      { pathname: "/organize", to: "/organize?tab=folder", tab: "folder", label: "Folders", icon: "fa-regular fa-folder-tree" },
    ],
  },
  {
    id: "do",
    label: "Do",
    icon: "fa-regular fa-bolt",
    children: [
      { pathname: "/goals", to: "/goals", tab: null, label: "Goals", icon: "fa-regular fa-bullseye-arrow" },
    ],
  },
];

function DashMenu() {
  const { user, token, logout } = useAuth();
  const location = useLocation();

  const [mobileMenu, setMobileMenu] = useState(false);
  const closeMobileMenu = () => {
    setMobileMenu((prev) => !prev);
  };

  const [storageBytes, setStorageBytes] = useState(null);
  const [openGroups, setOpenGroups] = useState(() => {
    const initial = new Set();
    navGroups.forEach((group) => {
      if (group.children.some((child) => location.pathname === child.pathname)) {
        initial.add(group.id);
      }
    });
    return initial;
  });

  const toggleGroup = (id) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
  const activeTab = new URLSearchParams(location.search).get("tab");
  const isChildActive = (child) => {
    if (location.pathname !== child.pathname) return false;
    return child.pathname !== "/organize" || activeTab === child.tab;
  };
  const isGroupActive = (group) => group.children.some((child) => location.pathname === child.pathname);

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

            {navGroups.map((group) => {
              const open = openGroups.has(group.id);
              return (
                <div key={group.id}>
                  <div
                    className={`sidebarLink ${isGroupActive(group) ? "sidebarLinkActive" : ""}`}
                    onClick={() => toggleGroup(group.id)}
                  >
                    <span className="sidebarLinkIcon"><i className={group.icon}></i></span>
                    <span className="sidebarLinkLabel">{group.label}</span>
                    <i className={`fa-regular fa-chevron-right sidebarLinkChevron ${open ? "sidebarLinkChevronOpen" : ""}`}></i>
                  </div>
                  {open && (
                    <div className="sidebarSubNav">
                      {group.children.map((child) => (
                        <Link key={child.to} to={child.to} className={`sidebarSubLink ${isChildActive(child) ? "sidebarSubLinkActive" : ""}`}>
                          <i className={child.icon}></i>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="sidebarPinnedNav">
            {pinnedItems.map((item) => (
              <Link key={item.to} to={item.to} className={`sidebarLink ${isActive(item.to) ? "sidebarLinkActive" : ""}`}>
                <span className="sidebarLinkIcon"><i className={item.icon}></i></span>
                <span className="sidebarLinkLabel">{item.label}</span>
              </Link>
            ))}
          </div>

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
