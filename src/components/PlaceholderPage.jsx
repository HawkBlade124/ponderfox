import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import DashMenu from "./DashMenu.jsx";
import EmptyStateArt from "./EmptyStateArt.jsx";
import TopProfileTile from "./TopProfileTile.jsx";
import SearchBox from "./SearchBox.jsx";

function PlaceholderPage({ title, icon, description }) {
  const { user, loading } = useAuth();
  const [search, setSearch] = useState("");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div id="dashboard" className="w-full">
      <div id="dashWrap" className="flex w-full">
        <DashMenu />
        <div className="rightScreen w-full p-6 ml">
          <div id="homeHead" className="flex justify-between items-center">
            <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
              <i className={`${icon} text-[var(--accent)]`}></i> {title}
            </h1>
            <div className="flex items-center gap-3">
              <SearchBox value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${title.toLowerCase()}`} />
              <TopProfileTile />
            </div>
          </div>
          <div className="mt-5">
            <section className="dashBody w-full">
              <div className="emptyState">
                <EmptyStateArt size={110} className="emptyStateArt" />
                <p>{description}</p>
                <span className="comingSoonBadge">Coming soon</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlaceholderPage;
