import { useAuth } from "../../context/AuthContext.jsx";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashMenu from "../../components/DashMenu.jsx";
import EmptyStateArt from "../../components/EmptyStateArt.jsx";
import TopProfileTile from "../../components/TopProfileTile.jsx";
import SearchBox from "../../components/SearchBox.jsx";
import { getTierColor } from "../../utils/tier.js";
import { buildApiUrl } from "../../utils/api.js";
import AddMoodBoardModal from "../../components/modals/AddMoodBoard.jsx";

function MoodBoards() {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("thoughtViewMode") || "grid"
  );
  const [gridSize, setGridSize] = useState(
    () => localStorage.getItem("thoughtGridSize") || "medium"
  );

  useEffect(() => {
    if (loading || !token) return;

    const fetchBoards = async () => {
      try {
        const res = await fetch(`${buildApiUrl()}/moodboards`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setBoards(data.boards);
        } else {
          setError(data.error || "Failed to load mood boards");
        }
      } catch (err) {
        console.error("Error fetching mood boards:", err);
        setError("Failed to load mood boards");
      }
    };

    fetchBoards();
  }, [token, loading]);

  const createBoard = async (boardName) => {
    try {
      const res = await fetch(`${buildApiUrl()}/moodboards`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ boardName }),
      });
      const data = await res.json();
      if (!data.success) {
        return { success: false, error: data.error || "Failed to create mood board" };
      }
      navigate(`/mood-boards/${data.board.MoodBoardID}`);
    } catch (err) {
      console.error("Error creating mood board:", err);
      return { success: false, error: "Failed to create mood board" };
    }
  };

  const changeViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem("thoughtViewMode", mode);
  };

  const changeGridSize = (size) => {
    setGridSize(size);
    localStorage.setItem("thoughtGridSize", size);
  };

  const gridSizeClasses = {
    small: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5",
    medium: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
    large: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  };

  // Mood boards carry no creation date, so MoodBoardID (an auto-increment
  // primary key) stands in as the recency signal — same approach as the
  // Dashboard's "Mood Boards" preview widget.
  const sortBoards = (list) => {
    const compare = (a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.BoardName.localeCompare(b.BoardName);
        case "name-desc":
          return b.BoardName.localeCompare(a.BoardName);
        case "date-asc":
          return a.MoodBoardID - b.MoodBoardID;
        case "date-desc":
        default:
          return b.MoodBoardID - a.MoodBoardID;
      }
    };
    return [...list].sort(compare);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const sortedBoards = sortBoards(boards);
  const searchedBoards = sortedBoards.filter((b) =>
    b.BoardName.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div id="dashboard" className="w-full">
      <div id="dashWrap" className="flex w-full">
        <DashMenu />
        <div className="rightScreen w-full p-6 ml">
          <div id="homeHead" className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <div className="dashBreadcrumb">Pages <i className="fa-regular fa-chevron-right text-[10px] mx-1"></i> <span>Mood Boards</span></div>
              <div className="flex items-center flex-wrap gap-4">
                <h1 className="text-2xl sm:text-3xl font-semibold text-white flex items-center gap-3">
                  <i className="fa-regular fa-game-board text-[var(--accent)]"></i> Mood Boards
                </h1>
                <span id="tierName" style={{ color: getTierColor(user.Tier), backgroundColor: `${getTierColor(user.Tier)}80` }}>{user.Tier}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {boards.length > 0 && (
                <SearchBox value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search mood boards" />
              )}
              <TopProfileTile />
            </div>
          </div>

          <div id="dashLayout" className="flex justify-between w-full mt-5">
            <div id="layoutLeft" className="w-full">
              <section className="dashBody w-full">
                <div className="flex items-center flex-wrap gap-2 justify-between">
                  <h2 className="text-2xl flex items-center gap-2">
                    <i className="fa-regular fa-game-board text-[var(--accent)]"></i>
                    Your Mood Boards
                  </h2>
                  <div className="flex items-center flex-wrap gap-2 w-full lg:w-auto">
                    {boards.length > 1 && (
                      <>
                        <select className="sortSelect" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                          <option value="date-desc">Newest first</option>
                          <option value="date-asc">Oldest first</option>
                          <option value="name-asc">Name (A–Z)</option>
                          <option value="name-desc">Name (Z–A)</option>
                        </select>
                        <div className="viewToggle flex items-center">
                          <button type="button" onClick={() => changeViewMode("grid")} className={`viewToggleBtn ${viewMode === "grid" ? "viewToggleBtnActive" : ""}`} title="Grid view">
                            <i className="fa-regular fa-table-cells"></i>
                          </button>
                          <button type="button" onClick={() => changeViewMode("list")} className={`viewToggleBtn ${viewMode === "list" ? "viewToggleBtnActive" : ""}`} title="List view">
                            <i className="fa-regular fa-list"></i>
                          </button>
                        </div>
                        {viewMode === "grid" && (
                          <div className="viewToggle flex items-center">
                            <button type="button" onClick={() => changeGridSize("small")} className={`viewToggleBtn ${gridSize === "small" ? "viewToggleBtnActive" : ""}`} title="Small grid">S</button>
                            <button type="button" onClick={() => changeGridSize("medium")} className={`viewToggleBtn ${gridSize === "medium" ? "viewToggleBtnActive" : ""}`} title="Medium grid">M</button>
                            <button type="button" onClick={() => changeGridSize("large")} className={`viewToggleBtn ${gridSize === "large" ? "viewToggleBtnActive" : ""}`} title="Large grid">L</button>
                          </div>
                        )}
                      </>
                    )}
                    <button type="button" className="statTile statTileAction quickActionButton" onClick={() => setShowAddModal(true)}>
                      <div className="statTileValue text-lg">New Mood Board</div>
                      <div className="statTileIcon"><i className="fa-regular fa-plus"></i></div>
                    </button>
                  </div>
                </div>

                {boards.length === 0 ? (
                  <div className="emptyState">
                    <EmptyStateArt size={120} className="emptyStateArt" />
                    <p>No mood boards yet — collect images and inspiration that capture how you&apos;re feeling.</p>
                    <button type="button" className="emptyStateAction" onClick={() => setShowAddModal(true)}>Create a mood board</button>
                  </div>
                ) : searchedBoards.length === 0 ? (
                  <div className="emptyState">
                    <EmptyStateArt size={120} className="emptyStateArt" />
                    <p>Nothing matches &quot;{search}&quot;.</p>
                    <button type="button" className="emptyStateAction" onClick={() => setSearch("")}>Clear search</button>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className={`grid ${gridSizeClasses[gridSize]} gap-6 w-full mb-5 mt-5 text-3xl place-items-center`}>
                    {searchedBoards.map((b) => (
                      <Link
                        key={b.MoodBoardID}
                        to={`/mood-boards/${b.MoodBoardID}`}
                        className="thoughtItem w-full flex flex-col items-center justify-between no-underline"
                      >
                        <div className="flex justify-between w-full">
                          <i className="text-xl fa-regular fa-game-board"></i>
                        </div>
                        <div className="thoughtName">{b.BoardName}</div>
                        <div className="text-lg text-slate-400">{b.SectionCount} {b.SectionCount === 1 ? "section" : "sections"}</div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 w-full mb-5 mt-5">
                    {searchedBoards.map((b) => (
                      <Link key={b.MoodBoardID} to={`/mood-boards/${b.MoodBoardID}`} className="thoughtRow w-full flex items-center gap-4">
                        <i className="text-lg fa-regular fa-game-board text-[var(--accent)]"></i>
                        <div className="flex-1 min-w-0">
                          <div className="thoughtName truncate">{b.BoardName}</div>
                          <div className="text-sm text-slate-400 truncate">{b.SectionCount} {b.SectionCount === 1 ? "section" : "sections"}</div>
                        </div>
                        <i className="fa-regular fa-chevron-right text-sm text-slate-500"></i>
                      </Link>
                    ))}
                  </div>
                )}
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </section>
            </div>
          </div>
        </div>
      </div>

      <AddMoodBoardModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onConfirm={(boardName) => createBoard(boardName)}
      />
    </div>
  );
}

export default MoodBoards;
