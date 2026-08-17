import { useAuth } from "../../context/AuthContext.jsx";
import { useState } from "react";
import { Link } from "react-router-dom";
import DashMenu from "../../components/DashMenu.jsx";
import TopProfileTile from "../../components/TopProfileTile.jsx";
import SearchBox from "../../components/SearchBox.jsx";
import PonderFoxMark from "../../components/PonderFoxMark.jsx";
import { PROMPT_CATEGORIES, getCategoryMeta } from "../../data/prompts.js";

const RANDOM_CATEGORY = getCategoryMeta("random");
const CATEGORY_TILES = [...PROMPT_CATEGORIES, RANDOM_CATEGORY];

function Prompts() {
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

  const searchedCategories = CATEGORY_TILES.filter((c) =>
    c.label.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div id="dashboard" className="w-full">
      <div id="dashWrap" className="flex w-full">
        <DashMenu />
        <div className="rightScreen w-full p-6 ml">
          <div id="homeHead" className="flex justify-between items-center">
            <div>
              <div className="dashBreadcrumb">Pages <i className="fa-regular fa-chevron-right text-[10px] mx-1"></i> <span>Prompts</span></div>
              <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
                <i className="fa-regular fa-microphone-stand text-[var(--accent)]"></i> Prompts
              </h1>
              <p className="text-sm text-slate-400 mt-1">Pick a category and get a question to sit with.</p>
            </div>
            <div className="flex items-center gap-3">
              <SearchBox value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search prompt categories" />
              <TopProfileTile />
            </div>
          </div>

          <div className="mt-5">
            <section className="dashBody w-full">
              {searchedCategories.length === 0 ? (
                <div className="emptyState">
                  <PonderFoxMark size={120} className="emptyStateArt" />
                  <p>Nothing matches &quot;{search}&quot;.</p>
                  <button type="button" className="emptyStateAction" onClick={() => setSearch("")}>Clear search</button>
                </div>
              ) : (
              <div id="promptCategoryList" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-5 mt-5 place-items-center">
                {searchedCategories.map((c) => (
                  <Link
                    key={c.key}
                    to={`/prompts/${c.key}`}
                    className="thoughtItem w-full flex flex-col items-center justify-between"
                  >
                    <div className="flex justify-between w-full">
                      <i className={`text-xl ${c.icon}`}></i>
                    </div>
                    <div className="thoughtName">{c.label}</div>
                    <div className="text-sm text-slate-400 text-center">{c.description}</div>
                  </Link>
                ))}
              </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Prompts;
