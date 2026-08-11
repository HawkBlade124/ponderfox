import { useAuth } from "../context/AuthContext.jsx";
import DashMenu from "./DashMenu.jsx";
import PonderFoxMark from "./PonderFoxMark.jsx";

function PlaceholderPage({ title, icon, description }) {
  const { user, loading } = useAuth();

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
              <i className={`${icon} text-[#438eef]`}></i> {title}
            </h1>
          </div>
          <div className="mt-5">
            <section className="dashBody w-full">
              <div className="emptyState">
                <PonderFoxMark size={110} className="emptyStateArt" />
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
