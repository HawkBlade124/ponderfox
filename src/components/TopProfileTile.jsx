import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getInitials } from "../utils/user.js";

function TopProfileTile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="topProfileTile">
      <Link to="/settings" className="flex items-center gap-[10px] min-w-0" style={{ textDecoration: "none" }}>
        <div className="topProfileAvatar">{getInitials(user.Username)}</div>
        <div className="topProfileInfo">
          <div className="topProfileName">{user.Username}</div>
          <div className="topProfileEmail">{user.Email}</div>
        </div>
      </Link>
      {user.Tier === "Free Thinker" && (
        <Link to="/pricing" className="topProfileUpgrade">
          <i className="fa-solid fa-arrow-up"></i> Upgrade
        </Link>
      )}
      <i className="fa-regular fa-arrow-right-from-bracket topProfileLogout" title="Logout" onClick={logout}></i>
    </div>
  );
}

export default TopProfileTile;
