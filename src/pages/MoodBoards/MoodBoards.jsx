import { useAuth } from "../../context/AuthContext.jsx";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashMenu from "../../components/DashMenu.jsx";
import EmptyStateArt from "../../components/EmptyStateArt.jsx";
import TopProfileTile from "../../components/TopProfileTile.jsx";
import SearchBox from "../../components/SearchBox.jsx";
import { buildApiUrl } from "../../utils/api.js";
import AddMoodBoardModal from "../../components/modals/AddMoodBoard.jsx";

function MoodBoards() {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const searchedBoards = boards.filter((b) =>
    b.BoardName.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div id="dashboard" className="w-full">
      <div id="dashWrap" className="flex w-full">
        <DashMenu />
        <div className="rightScreen w-full p-6 ml">
          <div id="homeHead" className="flex justify-between items-center">
            <div>
              <div className="dashBreadcrumb">Pages <i className="fa-regular fa-chevron-right text-[10px] mx-1"></i> <span>Mood Boards</span></div>
              <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
                <i className="fa-regular fa-game-board text-[var(--accent)]"></i> Mood Boards
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {boards.length > 1 && (
                <SearchBox value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search mood boards" />
              )}
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[var(--accent)] hover:bg-[color-mix(in srgb, var(--accent) 85%, black)] transition text-white font-semibold h-11 px-5 rounded-lg cursor-pointer flex items-center gap-2"
              >
                <i className="fa-regular fa-plus"></i> New Mood Board
              </button>
              <TopProfileTile />
            </div>
          </div>

          <div className="mt-5">
            <section className="dashBody w-full">
              {boards.length === 0 ? (
                <div className="emptyState">
                  <EmptyStateArt size={120} className="emptyStateArt" />
                  <p>No mood boards yet — collect images and inspiration that capture how you&apos;re feeling.</p>
                </div>
              ) : searchedBoards.length === 0 ? (
                <div className="emptyState">
                  <EmptyStateArt size={120} className="emptyStateArt" />
                  <p>Nothing matches &quot;{search}&quot;.</p>
                  <button type="button" className="emptyStateAction" onClick={() => setSearch("")}>Clear search</button>
                </div>
              ) : (
                <div id="moodBoardList" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-5 mt-5 place-items-center">
                  {searchedBoards.map((b) => (
                    <Link
                      key={b.MoodBoardID}
                      to={`/mood-boards/${b.MoodBoardID}`}
                      className="thoughtItem w-full flex flex-col items-center justify-between"
                    >
                      <div className="flex justify-between w-full">
                        <i className="text-xl fa-regular fa-game-board"></i>
                      </div>
                      <div className="thoughtName">{b.BoardName}</div>
                      <div className="text-lg">{b.SectionCount} {b.SectionCount === 1 ? "section" : "sections"}</div>
                    </Link>
                  ))}
                </div>
              )}
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </section>
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
