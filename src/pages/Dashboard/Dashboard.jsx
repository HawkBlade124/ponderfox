import { useAuth } from "../../context/AuthContext.jsx";
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import EditModal from "../../components/modals/Edit.jsx";
import DeleteModal from "../../components/modals/Delete.jsx";
import AddModal from "../../components/modals/Add.jsx";
import AddFolderModal from "../../components/modals/AddFolder.jsx";
import InfoModal from "../../components/modals/Info.jsx";
import DashMenu from "../../components/DashMenu.jsx";
import PonderFoxMark from "../../components/PonderFoxMark.jsx";
import TopProfileTile from "../../components/TopProfileTile.jsx";
import SearchBox from "../../components/SearchBox.jsx";
import { getTierColor } from "../../utils/tier.js";
import { buildApiUrl } from "../../utils/api.js";

function Dashboard() {

  const { user, Thoughts, setThoughts, token, loading } = useAuth();
  const { ListName, TagName, CategoryName } = useParams();

  const GroupType = ListName ? "list" : TagName ? "tag" : CategoryName ? "category" : null;
  const GroupName = ListName || TagName || CategoryName || null;

  const groupMeta = {
    list: {
      overviewPath: "/organize", overviewLabel: "Lists", icon: "fa-list-tree",
      emptyMessage: "No thoughts in this list yet.", apiSegment: "lists", bodyKey: "list",
      thoughtsPath: (name) => `lists/${encodeURIComponent(name)}/thoughts`,
    },
    tag: {
      overviewPath: "/organize?tab=tag", overviewLabel: "Tags", icon: "fa-tag",
      emptyMessage: "No thoughts tagged here yet.", apiSegment: "tags", bodyKey: "tag",
      thoughtsPath: (name) => `tags/by-name/${encodeURIComponent(name)}/thoughts`,
    },
    category: {
      overviewPath: "/organize?tab=category", overviewLabel: "Categories", icon: "fa-list",
      emptyMessage: "No thoughts in this category yet.", apiSegment: "categories", bodyKey: "category",
      thoughtsPath: (name) => `categories/by-name/${encodeURIComponent(name)}/thoughts`,
    },
  };
  const groupOverviewPath = GroupType ? groupMeta[GroupType].overviewPath : "/dashboard";
  const groupOverviewLabel = GroupType ? groupMeta[GroupType].overviewLabel : "Dashboard";
  const groupIcon = GroupType ? groupMeta[GroupType].icon : "fa-brain";
  const emptyGroupMessage = GroupType ? groupMeta[GroupType].emptyMessage : "";

  const [error, setError] = useState("");
  const [ThoughtName, setThoughtName] = useState("");
  const [ThoughtDescr, setThoughtDescr] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedThought, setSelectedThought] = useState("");
  const [favorite, setFavorite] = useState(false);

  const [listThoughts, setListThoughts] = useState([]);
  const [listsOverview, setListsOverview] = useState([]);
  const [moodBoards, setMoodBoards] = useState([]);
  const [sortBy, setSortBy] = useState("date-desc");
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("thoughtViewMode") || "grid"
  );
  const [gridSize, setGridSize] = useState(
    () => localStorage.getItem("thoughtGridSize") || "medium"
  );
  const [brainDumpSearch, setBrainDumpSearch] = useState("");
  const [quickAccessSearch, setQuickAccessSearch] = useState("");
  const [recentSearch, setRecentSearch] = useState("");
  const [listsSearch, setListsSearch] = useState("");
  const [moodBoardsSearch, setMoodBoardsSearch] = useState("");

  const matchesSearch = (thought, query) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      thought.ThoughtName.toLowerCase().includes(q) ||
      (thought.ThoughtDescr || "").toLowerCase().includes(q)
    );
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

  const displayThoughts = GroupName ? listThoughts : Thoughts;
  const updateThoughts = GroupName ? setListThoughts : setThoughts;

  const sortThoughts = (list) => {
    const compare = (a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.ThoughtName.localeCompare(b.ThoughtName);
        case "name-desc":
          return b.ThoughtName.localeCompare(a.ThoughtName);
        case "date-asc":
          return new Date(a.DateCreated) - new Date(b.DateCreated);
        case "favorites":
          return Number(b.Favorite) - Number(a.Favorite);
        case "date-desc":
        default:
          return new Date(b.DateCreated) - new Date(a.DateCreated);
      }
    };

    return [...list].sort((a, b) => {
      const pinDiff = Number(b.Pinned) - Number(a.Pinned);
      return pinDiff !== 0 ? pinDiff : compare(a, b);
    });
  };

  const sortedThoughts = sortThoughts(displayThoughts);
  const searchedThoughts = sortedThoughts.filter((f) => matchesSearch(f, brainDumpSearch));

  const sortedFolders = GroupName
    ? []
    : [...listsOverview].sort((a, b) => a.ListName.localeCompare(b.ListName));
  const searchedFolders = sortedFolders.filter((l) =>
    l.ListName.toLowerCase().includes(brainDumpSearch.trim().toLowerCase())
  );

  const DASH_PREVIEW_LIMIT = 3;

  const pinnedThoughts = [...Thoughts].filter((f) => f.Pinned).sort((a, b) => new Date(b.DateCreated) - new Date(a.DateCreated));
  const searchedPinnedThoughts = pinnedThoughts.filter((f) => matchesSearch(f, quickAccessSearch)).slice(0, DASH_PREVIEW_LIMIT);

  const recentThoughts = [...Thoughts].sort((a, b) => new Date(b.DateCreated) - new Date(a.DateCreated));
  const searchedRecentThoughts = recentThoughts.filter((f) => matchesSearch(f, recentSearch)).slice(0, DASH_PREVIEW_LIMIT);

  const searchedListsOverview = listsOverview
    .filter((l) => l.ListName.toLowerCase().includes(listsSearch.trim().toLowerCase()))
    .slice(0, DASH_PREVIEW_LIMIT);

  // Mood boards carry no creation date, so MoodBoardID (an auto-increment
  // primary key) stands in as the recency signal.
  const moodBoardsByRecency = [...moodBoards].sort((a, b) => b.MoodBoardID - a.MoodBoardID);
  const searchedMoodBoards = moodBoardsByRecency
    .filter((b) => b.BoardName.toLowerCase().includes(moodBoardsSearch.trim().toLowerCase()))
    .slice(0, DASH_PREVIEW_LIMIT);


const editThought = async (ThoughtId, newName, newDescr) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/thoughts/${ThoughtId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ThoughtName: newName.trim(),
        ThoughtDescr: newDescr.trim(),
      }),
    });

    const data = await res.json();
    if (res.ok) {
      updateThoughts((prev) =>
        prev.map((f) =>
          f.ThoughtID === ThoughtId
            ? { ...f, ThoughtName: newName, ThoughtDescr: newDescr }
            : f
        )
      );
    } else {
      setError(data.error || "Failed to update Thought");
    }
  } catch (err) {
    console.error("Edit error:", err);
    setError("An error occurred while editing.");
  }
};

const deleteThought = async (ThoughtId) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/thoughts/${ThoughtId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (res.ok) {
      updateThoughts((prev) => prev.filter((f) => f.ThoughtID !== ThoughtId));
    } else {
      setError(data.error || "Failed to delete Thought");
    }
  } catch (err) {
    console.error("Delete error:", err);
    setError("An error occurred while deleting.");
  }
};

const addThought = async (ThoughtName, ThoughtDescr) => {

  if (!ThoughtName.trim() || !ThoughtDescr.trim()) {
    return { success: false, error: "Thought name and description are both required." };
  }

  try {

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/thoughts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ThoughtName: ThoughtName.trim(),
        ThoughtDescr: ThoughtDescr.trim(),
      }),
    });

    const data = await res.json();

    if (res.ok) {
      updateThoughts((prev) => [...prev, data.newThought]);

      if (GroupType) {
        const { apiSegment, bodyKey } = groupMeta[GroupType];
        try {
          await fetch(`${import.meta.env.VITE_API_URL}/api/${apiSegment}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ [bodyKey]: GroupName, ThoughtID: data.newThought.ThoughtID }),
          });
        } catch (err) {
          console.error("Error adding new thought to group:", err);
        }
      }

      return { success: true };
    } else {
      return { success: false, error: data.message || data.error || "Unauthorized or invalid entry." };
    }
  } catch (err) {
    console.error("Fetch error:", err);
    return { success: false, error: "An error occurred. Please try again." };
  }
};
const favoriteThought = async (ThoughtId, Favorite) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/thoughts/${ThoughtId}/favorite`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ Favorite: Boolean(Favorite) }),
    });

    const data = await res.json();

    if (res.ok) {
      updateThoughts((prev) =>
        prev.map((f) =>
          f.ThoughtID === ThoughtId ? { ...f, Favorite } : f
        )
      );
    } else {
      setError(data.error || "Failed to update Thought");
    }
  } catch (err) {
    console.error("Edit error:", err);
    setError("An error occurred while editing.");
  }
};

const pinThought = async (ThoughtId, Pinned) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/thoughts/${ThoughtId}/pin`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ Pinned: Boolean(Pinned) }),
    });

    const data = await res.json();

    if (res.ok) {
      updateThoughts((prev) =>
        prev.map((f) =>
          f.ThoughtID === ThoughtId ? { ...f, Pinned } : f
        )
      );
    } else {
      setError(data.error || "Failed to update Thought");
    }
  } catch (err) {
    console.error("Edit error:", err);
    setError("An error occurred while editing.");
  }
};

const editSingleThought = (Thought) => {
  console.log(Thought)
  setSelectedThought(Thought);
  setThoughtName(Thought.ThoughtName);
  setThoughtDescr(Thought.ThoughtDescr);
  setShowEditModal(true);
};

const deleteThoughtModal = (Thought)=>{
    console.log(Thought)
  setSelectedThought(Thought);
  setThoughtName(Thought.ThoughtName);
  setThoughtDescr(Thought.ThoughtDescr);
  setShowDeleteModal(true);
}

const addThoughtModal = () => {
  setThoughtName("");
  setThoughtDescr("");
  setSelectedThought(null);
  setShowAddModal(true);
};

const infoThoughtModal = (thought) =>{
  setSelectedThought(thought);
  setShowInfoModal(true);
}


useEffect(() => {
  if (loading || !token) return;

  const fetchThoughts = async () => {
    try {
      const url = GroupType
        ? `${import.meta.env.VITE_API_URL}/api/${groupMeta[GroupType].thoughtsPath(GroupName)}`
        : `${import.meta.env.VITE_API_URL}/api/thoughts?unlisted=true`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const parsed = Array.isArray(data) ? data : data.Thoughts || data.data || [];
      if (GroupName) {
        setListThoughts(parsed);
      } else {
        setThoughts(parsed);
      }
    } catch (err) {
      console.error("Error fetching Thoughts:", err);
      setError("Failed to load Thoughts");
    }
  };

  fetchThoughts();
}, [token, loading, GroupType, GroupName]);

const fetchListsOverview = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lists`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setListsOverview(data.lists);
  } catch (err) {
    console.error("Error fetching lists overview:", err);
  }
};

useEffect(() => {
  if (loading || !token) return;
  fetchListsOverview();
}, [token, loading]);

useEffect(() => {
  if (loading || !token) return;

  const fetchMoodBoards = async () => {
    try {
      const res = await fetch(`${buildApiUrl()}/moodboards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setMoodBoards(data.boards);
    } catch (err) {
      console.error("Error fetching mood boards:", err);
    }
  };

  fetchMoodBoards();
}, [token, loading]);

const addFolder = async (folderName) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lists`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ list: folderName.trim() }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      await fetchListsOverview();
      return { success: true };
    }
    return { success: false, error: data.details || data.error || "Failed to create folder" };
  } catch (err) {
    console.error("Error creating folder:", err);
    return { success: false, error: "Could not reach the server. Check your connection and try again." };
  }
};
if (loading) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-xl animate-pulse">Loading your thoughts...</div>
    </div>
  );
}

if (!user) return null;

  return (
    <div id="dashboard" className="w-full">
      <EditModal  isOpen={showEditModal}  onClose={() => setShowEditModal(false)} thought={selectedThought}  onSave={editThought}/>
      <DeleteModal  isOpen={showDeleteModal}  onClose={() => setShowDeleteModal(false)} thought={selectedThought}  onConfirm={() => deleteThought(selectedThought.ThoughtID)}/>
     <AddModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onConfirm={(ThoughtName, ThoughtDescr) => addThought(ThoughtName, ThoughtDescr)}/>
    <AddFolderModal isOpen={showAddFolderModal} onClose={() => setShowAddFolderModal(false)} onConfirm={(folderName) => addFolder(folderName)}/>
    <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} thought={selectedThought}/>
      <div id="dashWrap" className="flex w-full">
        <DashMenu />
      <div className="rightScreen w-full p-6 ml">
      <div id="homeHead" className="flex justify-between items-center">
        <div>
          <div className="dashBreadcrumb">
            Pages <i className="fa-regular fa-chevron-right text-[10px] mx-1"></i>{" "}
            {GroupName ? (
              <><Link to={groupOverviewPath}>{groupOverviewLabel}</Link> <i className="fa-regular fa-chevron-right text-[10px] mx-1"></i> <span>{GroupName}</span></>
            ) : (
              <span>Dashboard</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-semibold text-white">{GroupName || "Your Thought Dashboard"}</h1>
            {!GroupName && (
              <span id="tierName" style={{ color: getTierColor(user.Tier), backgroundColor: `${getTierColor(user.Tier)}80` }}>{user.Tier}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {displayThoughts.length + sortedFolders.length > 1 && (
            <SearchBox value={brainDumpSearch} onChange={(e) => setBrainDumpSearch(e.target.value)} placeholder="Search thoughts and folders" />
          )}
          <TopProfileTile />
        </div>
      </div>

      <div id="dashLayout" className="flex justify-between w-full  mt-5">
      <div id="layoutLeft" className="w-full">

      <section className="dashBody w-full">
        <div className="flex flex-col gap-3">
        <div className="flex items-center flex-wrap gap-2 justify-between lg:justify-between">
          <h2 className="text-2xl flex items-center gap-2">
            <i className={`fa-regular ${groupIcon} text-[var(--accent)]`}></i>
            {GroupName || "Your Brain Dump"}
          </h2>
          <div className="flex items-center gap-2 w-full lg:w-auto">
          {displayThoughts.length + sortedFolders.length > 1 && (
            <>
            <select className="sortSelect" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
              <option value="favorites">Favorites first</option>
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
          <button type="button" className="statTile statTileAction quickActionButton" onClick={() => addThoughtModal()}>
            <div className="statTileValue text-lg">New Thought</div>
            <div className="statTileIcon"><i className="fa-regular fa-message-plus"></i></div>
          </button>
          {!GroupName && (
            <button type="button" className="statTile statTileAction quickActionButton" onClick={() => setShowAddFolderModal(true)}>
              <div className="statTileValue text-lg">New Folder</div>
              <div className="statTileIcon"><i className="fa-regular fa-folder-plus"></i></div>
            </button>
          )}
          </div>
        </div>

        </div>

        {displayThoughts.length === 0 && sortedFolders.length === 0 ? (
          <div className="emptyState">
            <PonderFoxMark size={120} className="emptyStateArt" />
            <p>{GroupName ? emptyGroupMessage : "No thoughts or folders yet — start your first brain dump."}</p>
            <button type="button" className="emptyStateAction" onClick={() => addThoughtModal()}>Create a thought</button>
          </div>
        ) : searchedThoughts.length === 0 && searchedFolders.length === 0 ? (
          <div className="emptyState">
            <PonderFoxMark size={120} className="emptyStateArt" />
            <p>Nothing matches &quot;{brainDumpSearch}&quot;.</p>
            <button type="button" className="emptyStateAction" onClick={() => setBrainDumpSearch("")}>Clear search</button>
          </div>
        ) : viewMode === "grid" ? (
        <div className="flex flex-col w-full mb-5 mt-5">
          {searchedFolders.length > 0 && (
            <div className="w-full">
              <h3 className="dashGroupLabel"><i className="fa-solid fa-folder"></i> Folders</h3>
              <div className={`grid ${gridSizeClasses[gridSize]} gap-6 w-full text-3xl place-items-center`}>
                {searchedFolders.map((l) => (
                  <Link key={l.ListName} to={`/thoughts/${encodeURIComponent(l.ListName)}`} className="thoughtItem w-full flex flex-col items-center justify-between no-underline">
                    <div className="flex justify-between w-full">
                      <i className="text-xl fa-solid fa-folder text-[var(--accent)]"></i>
                    </div>
                    <div className="thoughtName">{l.ListName}</div>
                    <div className="text-lg text-slate-400">{l.ThoughtCount} {l.ThoughtCount === 1 ? "thought" : "thoughts"}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {searchedThoughts.length > 0 && (
            <div className="w-full">
              <h3 className="dashGroupLabel mt-15"><i className="fa-solid fa-brain"></i> Thoughts</h3>
              <div className={`grid ${gridSizeClasses[gridSize]} gap-6 w-full text-3xl place-items-center`}>
                {searchedThoughts.map((f, i) => (
                  <Link
                    key={i}
                    to={`/thought/${encodeURIComponent(f.ThoughtName)}`}
                    className="thoughtItem w-full flex flex-col items-center justify-between no-underline"
                  >
                    <div className="flex justify-between w-full">
                      <i onClick={(e) => { e.preventDefault(); e.stopPropagation(); pinThought(f.ThoughtID, !f.Pinned); }} className={`text-xl cursor-pointer ${f.Pinned ? "fa-solid fa-thumbtack-angle text-[var(--accent)]" : "fa-regular fa-thumbtack-angle"}`}></i>
                      <div className="flex">
                        <i onClick={(e) => { e.preventDefault(); e.stopPropagation(); favoriteThought(f.ThoughtID, !f.Favorite); }} className={`text-xl cursor-pointer ${f.Favorite ? "fa-solid fa-heart text-red-500" : "fa-regular fa-heart"}`}/>
                        <i onClick={(e) => { e.preventDefault(); e.stopPropagation(); infoThoughtModal(f); }} className="text-xl cursor-pointer fa-regular fa-circle-info"/>
                      </div>
                    </div>
                    <div className="thoughtName">{f.ThoughtName}</div>
                    <div className="text-lg">{f.ThoughtDescr}</div>
                    <div className="thoughtFoot flex items-center justify-end w-full mt-5">
                      <div className="thoughtFunctions flex items-center justify-end w-full gap-1">
                        <i onClick={(e) => { e.preventDefault(); e.stopPropagation(); editSingleThought(f); }} className="text-xl fa-solid fa-cog cursor-pointer hover:text-blue-200"></i>
                        <i onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteThoughtModal(f); }} className="text-xl fa-solid fa-trash cursor-pointer text-red-500 hover:text-red-200"></i>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        ) : (
        <div className="flex flex-col w-full mb-5 mt-5">
          {searchedFolders.length > 0 && (
            <div className="w-full">
              <h3 className="dashGroupLabel"><i className="fa-solid fa-folder"></i> Folders</h3>
              <div className="flex flex-col gap-3 w-full">
                {searchedFolders.map((l) => (
                  <Link key={l.ListName} to={`/thoughts/${encodeURIComponent(l.ListName)}`} className="thoughtRow w-full flex items-center gap-4">
                    <i className="text-lg fa-solid fa-folder text-[var(--accent)]"></i>
                    <div className="flex-1 min-w-0">
                      <div className="thoughtName truncate">{l.ListName}</div>
                      <div className="text-sm text-slate-400 truncate">{l.ThoughtCount} {l.ThoughtCount === 1 ? "thought" : "thoughts"}</div>
                    </div>
                    <i className="fa-regular fa-chevron-right text-sm text-slate-500"></i>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {searchedThoughts.length > 0 && (
            <div className="w-full">
              <h3 className="dashGroupLabel mt-15"><i className="fa-solid fa-brain"></i> Thoughts</h3>
              <div className="flex flex-col gap-3 w-full">
                {searchedThoughts.map((f, i) => (
                  <Link key={i} to={`/thought/${encodeURIComponent(f.ThoughtName)}`} className="thoughtRow w-full flex items-center gap-4">
                    <i onClick={(e) => { e.preventDefault(); e.stopPropagation(); pinThought(f.ThoughtID, !f.Pinned); }} className={`text-lg cursor-pointer ${f.Pinned ? "fa-solid fa-thumbtack-angle text-[var(--accent)]" : "fa-regular fa-thumbtack-angle"}`}></i>
                    <div className="flex-1 min-w-0">
                      <div className="thoughtName truncate">{f.ThoughtName}</div>
                      <div className="text-sm text-slate-400 truncate">{f.ThoughtDescr}</div>
                    </div>
                    <i onClick={(e) => { e.preventDefault(); e.stopPropagation(); favoriteThought(f.ThoughtID, !f.Favorite); }} className={`text-lg cursor-pointer ${f.Favorite ? "fa-solid fa-heart text-red-500" : "fa-regular fa-heart"}`}/>
                    <i onClick={(e) => { e.preventDefault(); e.stopPropagation(); infoThoughtModal(f); }} className="text-lg cursor-pointer fa-regular fa-circle-info"/>
                    <i onClick={(e) => { e.preventDefault(); e.stopPropagation(); editSingleThought(f); }} className="text-lg fa-solid fa-cog cursor-pointer hover:text-blue-200"></i>
                    <i onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteThoughtModal(f); }} className="text-lg fa-solid fa-trash cursor-pointer text-red-500 hover:text-red-200"></i>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        )}
      </section>

      {!GroupName && (
      <div id="dashGrid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mt-5">
        <section className="dashBody">
          <h2 className="text-lg flex items-center gap-2"><i className="fa-regular fa-clock-rotate-left text-[var(--accent)]"></i> Recent</h2>
          {Thoughts.length > DASH_PREVIEW_LIMIT && (
            <div className="dashSearchInput dashSearchInputFull mt-2">
              <i className="fa-regular fa-magnifying-glass"></i>
              <input type="text" value={recentSearch} onChange={(e) => setRecentSearch(e.target.value)} placeholder="Search recent" />
            </div>
          )}
          {recentThoughts.length === 0 ? (
            <div className="emptyState emptyStateSmall">
              <PonderFoxMark size={48} sparkle={false} className="emptyStateArt" />
              <p>No recent thoughts</p>
            </div>
          ) : searchedRecentThoughts.length === 0 ? (
            <div className="emptyState emptyStateSmall">
              <PonderFoxMark size={48} sparkle={false} className="emptyStateArt" />
              <p>No matches</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              {searchedRecentThoughts.map((f) => (
                <Link key={f.ThoughtID} to={`/thought/${encodeURIComponent(f.ThoughtName)}`} className="thoughtRow thoughtRowCompact flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="thoughtName truncate">{f.ThoughtName}</div>
                    <div className="text-xs text-slate-400 truncate">{f.ThoughtDescr}</div>
                  </div>
                  <i className="fa-regular fa-chevron-right text-xs text-slate-500"></i>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="dashBody">
          <h2 className="text-lg flex items-center gap-2"><i className="fa-regular fa-bolt text-[var(--accent)]"></i> Quick Access</h2>
          {pinnedThoughts.length > DASH_PREVIEW_LIMIT && (
            <div className="dashSearchInput dashSearchInputFull mt-2">
              <i className="fa-regular fa-magnifying-glass"></i>
              <input type="text" value={quickAccessSearch} onChange={(e) => setQuickAccessSearch(e.target.value)} placeholder="Search pinned" />
            </div>
          )}
          {pinnedThoughts.length === 0 ? (
            <div className="emptyState emptyStateSmall">
              <PonderFoxMark size={48} sparkle={false} className="emptyStateArt" />
              <p>No pinned thoughts</p>
            </div>
          ) : searchedPinnedThoughts.length === 0 ? (
            <div className="emptyState emptyStateSmall">
              <PonderFoxMark size={48} sparkle={false} className="emptyStateArt" />
              <p>No matches</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              {searchedPinnedThoughts.map((f) => (
                <Link key={f.ThoughtID} to={`/thought/${encodeURIComponent(f.ThoughtName)}`} className="thoughtRow thoughtRowCompact flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="thoughtName truncate">{f.ThoughtName}</div>
                    <div className="text-xs text-slate-400 truncate">{f.ThoughtDescr}</div>
                  </div>
                  <i className="fa-regular fa-chevron-right text-xs text-slate-500"></i>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="dashBody">
          <h2 className="text-lg flex items-center gap-2"><i className="fa-regular fa-list-tree text-[var(--accent)]"></i> Lists</h2>
          {listsOverview.length > DASH_PREVIEW_LIMIT && (
            <div className="dashSearchInput dashSearchInputFull mt-2">
              <i className="fa-regular fa-magnifying-glass"></i>
              <input type="text" value={listsSearch} onChange={(e) => setListsSearch(e.target.value)} placeholder="Search lists" />
            </div>
          )}
          {listsOverview.length === 0 ? (
            <div className="emptyState emptyStateSmall">
              <PonderFoxMark size={48} sparkle={false} className="emptyStateArt" />
              <p>No lists created</p>
            </div>
          ) : searchedListsOverview.length === 0 ? (
            <div className="emptyState emptyStateSmall">
              <PonderFoxMark size={48} sparkle={false} className="emptyStateArt" />
              <p>No matches</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              {searchedListsOverview.map((l) => (
                <Link key={l.ListName} to={`/thoughts/${encodeURIComponent(l.ListName)}`} className="thoughtRow thoughtRowCompact flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="thoughtName truncate">{l.ListName}</div>
                    <div className="text-xs text-slate-400 truncate">{l.ThoughtCount} {l.ThoughtCount === 1 ? "thought" : "thoughts"}</div>
                  </div>
                  <i className="fa-regular fa-chevron-right text-xs text-slate-500"></i>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="dashBody">
          <h2 className="text-lg flex items-center gap-2"><i className="fa-regular fa-images text-[var(--accent)]"></i> Mood Boards</h2>
          {moodBoards.length > DASH_PREVIEW_LIMIT && (
            <div className="dashSearchInput dashSearchInputFull mt-2">
              <i className="fa-regular fa-magnifying-glass"></i>
              <input type="text" value={moodBoardsSearch} onChange={(e) => setMoodBoardsSearch(e.target.value)} placeholder="Search mood boards" />
            </div>
          )}
          {moodBoards.length === 0 ? (
            <div className="emptyState emptyStateSmall">
              <PonderFoxMark size={48} sparkle={false} className="emptyStateArt" />
              <p>No mood boards</p>
            </div>
          ) : searchedMoodBoards.length === 0 ? (
            <div className="emptyState emptyStateSmall">
              <PonderFoxMark size={48} sparkle={false} className="emptyStateArt" />
              <p>No matches</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              {searchedMoodBoards.map((b) => (
                <Link key={b.MoodBoardID} to={`/mood-boards/${b.MoodBoardID}`} className="thoughtRow thoughtRowCompact flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="thoughtName truncate">{b.BoardName}</div>
                    <div className="text-xs text-slate-400 truncate">{b.SectionCount} {b.SectionCount === 1 ? "section" : "sections"}</div>
                  </div>
                  <i className="fa-regular fa-chevron-right text-xs text-slate-500"></i>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
      )}
      </div>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      </div>
      </div>
    </div>
  );
}

export default Dashboard;
