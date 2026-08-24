import { useAuth } from "../../context/AuthContext.jsx";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import EditModal from "../../components/modals/Edit.jsx";
import DeleteModal from "../../components/modals/Delete.jsx";
import AddModal from "../../components/modals/Add.jsx";
import AddFolderModal from "../../components/modals/AddFolder.jsx";
import InfoModal from "../../components/modals/Info.jsx";
import DashMenu from "../../components/DashMenu.jsx";
import EmptyStateArt from "../../components/EmptyStateArt.jsx";
import TopProfileTile from "../../components/TopProfileTile.jsx";
import SearchBox from "../../components/SearchBox.jsx";
import { getTierColor } from "../../utils/tier.js";
import { formatRelativeTime } from "../../utils/format.js";
import { useSpeechDictation } from "../../hooks/useSpeechDictation.js";

const escapeHtml = (str) =>
  str.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

function Voice() {

  const { user, Thoughts, setThoughts, token, loading } = useAuth();

  const [error, setError] = useState("");
  const [ThoughtName, setThoughtName] = useState("");
  const [ThoughtDescr, setThoughtDescr] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedThought, setSelectedThought] = useState("");

  const [listsOverview, setListsOverview] = useState([]);
  const [sortBy, setSortBy] = useState("date-desc");
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("thoughtViewMode") || "grid"
  );
  const [gridSize, setGridSize] = useState(
    () => localStorage.getItem("thoughtGridSize") || "medium"
  );
  const [brainDumpSearch, setBrainDumpSearch] = useState("");

  // ---------- Voice dictation ----------
  const dictation = useSpeechDictation();
  const [dictatingThought, setDictatingThought] = useState(null);
  const [dictationSending, setDictationSending] = useState(false);
  const [dictationSentId, setDictationSentId] = useState(null);
  const dictationText = `${dictation.transcript} ${dictation.interim}`.trim();

  const toggleDictation = (thought) => {
    if (dictatingThought?.ThoughtID === thought.ThoughtID) {
      dictation.listening ? dictation.stop() : dictation.start();
      return;
    }
    if (dictatingThought) dictation.reset();
    setDictationSentId(null);
    setDictatingThought(thought);
    dictation.start();
  };

  const cancelDictation = () => {
    dictation.reset();
    setDictatingThought(null);
  };

  const sendDictation = async () => {
    if (!dictatingThought || !dictationText) return;
    dictation.stop();
    setDictationSending(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ThoughtName: dictatingThought.ThoughtName,
          message: `<p>${escapeHtml(dictationText)}</p>`,
          attachments: [],
        }),
      });

      const data = await res.json();
      const sentThoughtId = dictatingThought.ThoughtID;

      if (res.ok && data.success) {
        dictation.reset();
        setDictatingThought(null);
        setDictationSentId(sentThoughtId);
        setTimeout(() => setDictationSentId((id) => (id === sentThoughtId ? null : id)), 2500);
        markVoiceUsed(sentThoughtId);
      } else {
        setError(data.error || data.details || "Failed to add voice note");
      }
    } catch (err) {
      console.error("Dictation send error:", err);
      setError("An error occurred while saving your voice note.");
    } finally {
      setDictationSending(false);
    }
  };

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

  // A thought fresh off the "New Thought" modal (or any other partial object)
  // may be missing DateCreated/Pinned until the next full refetch — Date/Number
  // conversions on undefined yield NaN, and a NaN-returning comparator makes
  // Array.prototype.sort's ordering unreliable. Coerce to safe fallbacks so a
  // stray partial record can't scramble the whole list's order.
  const dateValue = (thought) => new Date(thought.DateCreated).getTime() || 0;

  const sortThoughts = (list) => {
    const compare = (a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.ThoughtName.localeCompare(b.ThoughtName);
        case "name-desc":
          return b.ThoughtName.localeCompare(a.ThoughtName);
        case "date-asc":
          return dateValue(a) - dateValue(b);
        case "favorites":
          return Number(Boolean(b.Favorite)) - Number(Boolean(a.Favorite));
        case "date-desc":
        default:
          return dateValue(b) - dateValue(a);
      }
    };

    return [...list].sort((a, b) => {
      const pinDiff = Number(Boolean(b.Pinned)) - Number(Boolean(a.Pinned));
      return pinDiff !== 0 ? pinDiff : compare(a, b);
    });
  };

  // Voice is a "what still needs a voice note" view — once a thought has one,
  // it drops off this list (it still shows normally on the Dashboard).
  const voiceEligibleThoughts = Thoughts.filter((f) => !f.VoiceUsed);
  const allVoiceUsed = Thoughts.length > 0 && voiceEligibleThoughts.length === 0;
  const sortedThoughts = sortThoughts(voiceEligibleThoughts);
  const searchedThoughts = sortedThoughts.filter((f) => matchesSearch(f, brainDumpSearch));

  const sortedFolders = [...listsOverview].sort((a, b) => a.ListName.localeCompare(b.ListName));
  const searchedFolders = sortedFolders.filter((l) =>
    l.ListName.toLowerCase().includes(brainDumpSearch.trim().toLowerCase())
  );

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
        setThoughts((prev) =>
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
        setThoughts((prev) => prev.filter((f) => f.ThoughtID !== ThoughtId));
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
        setThoughts((prev) => [...prev, data.newThought]);
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
        setThoughts((prev) =>
          prev.map((f) => (f.ThoughtID === ThoughtId ? { ...f, Favorite } : f))
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
        setThoughts((prev) =>
          prev.map((f) => (f.ThoughtID === ThoughtId ? { ...f, Pinned } : f))
        );
      } else {
        setError(data.error || "Failed to update Thought");
      }
    } catch (err) {
      console.error("Edit error:", err);
      setError("An error occurred while editing.");
    }
  };

  const markVoiceUsed = async (ThoughtId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/thoughts/${ThoughtId}/voice-used`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ VoiceUsed: true }),
      });

      const data = await res.json();

      if (res.ok) {
        setThoughts((prev) =>
          prev.map((f) => (f.ThoughtID === ThoughtId ? { ...f, VoiceUsed: true } : f))
        );
      } else {
        setError(data.error || "Failed to flag thought as voiced");
      }
    } catch (err) {
      console.error("Voice-used flag error:", err);
    }
  };

  const editSingleThought = (Thought) => {
    setSelectedThought(Thought);
    setThoughtName(Thought.ThoughtName);
    setThoughtDescr(Thought.ThoughtDescr);
    setShowEditModal(true);
  };

  const deleteThoughtModal = (Thought) => {
    setSelectedThought(Thought);
    setThoughtName(Thought.ThoughtName);
    setThoughtDescr(Thought.ThoughtDescr);
    setShowDeleteModal(true);
  };

  const addThoughtModal = () => {
    setThoughtName("");
    setThoughtDescr("");
    setSelectedThought(null);
    setShowAddModal(true);
  };

  const infoThoughtModal = (thought) => {
    setSelectedThought(thought);
    setShowInfoModal(true);
  };

  useEffect(() => {
    if (loading || !token) return;

    const fetchThoughts = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/thoughts?unlisted=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const parsed = Array.isArray(data) ? data : data.Thoughts || data.data || [];
        setThoughts(parsed);
      } catch (err) {
        console.error("Error fetching Thoughts:", err);
        setError("Failed to load Thoughts");
      }
    };

    fetchThoughts();
  }, [token, loading]);

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

  const renderDictationPanel = (f, { overlay = false } = {}) => {
    if (dictatingThought?.ThoughtID !== f.ThoughtID) return null;
    return (
      <div className={`voiceDictationPanel ${overlay ? "voiceDictationPanelOverlay" : ""}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
        <div className="voiceDictationStatus">
          {dictation.listening ? (
            <><i className="fa-solid fa-waveform-lines fa-fade"></i> Listening…</>
          ) : (
            <><i className="fa-regular fa-pause"></i> Paused</>
          )}
        </div>
        <p className="voiceDictationText">
          {dictationText || <span className="voiceDictationPlaceholder">Say something…</span>}
        </p>
        {dictation.error && <p className="voiceDictationError">{dictation.error}</p>}
        <div className="voiceDictationActions">
          <button type="button" className="voiceDictationBtn" onClick={() => toggleDictation(f)}>
            {dictation.listening ? "Pause" : "Resume"}
          </button>
          <button type="button" className="voiceDictationBtn" onClick={cancelDictation}>Cancel</button>
          <button
            type="button"
            className="voiceDictationBtn voiceDictationBtnPrimary"
            onClick={sendDictation}
            disabled={!dictationText || dictationSending}
          >
            {dictationSending ? <i className="fa-solid fa-spinner fa-spin"></i> : "Add to Thought"}
          </button>
        </div>
      </div>
    );
  };

  const micIcon = (f, size = "text-xl") => (
    <i
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleDictation(f); }}
      className={`${size} cursor-pointer ${dictatingThought?.ThoughtID === f.ThoughtID && dictation.listening ? "fa-solid fa-microphone-lines text-[var(--accent)] fa-fade" : "fa-regular fa-microphone-lines"}`}
      title={dictation.supported ? "Dictate a voice note" : "Voice dictation isn't supported in this browser"}
    ></i>
  );

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
      <EditModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} thought={selectedThought} onSave={editThought} />
      <DeleteModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} thought={selectedThought} onConfirm={() => deleteThought(selectedThought.ThoughtID)} />
      <AddModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onConfirm={(ThoughtName, ThoughtDescr) => addThought(ThoughtName, ThoughtDescr)} />
      <AddFolderModal isOpen={showAddFolderModal} onClose={() => setShowAddFolderModal(false)} onConfirm={(folderName) => addFolder(folderName)} />
      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} thought={selectedThought} />
      <div id="dashWrap" className="flex w-full">
        <DashMenu />
        <div className="rightScreen w-full p-6 ml">
          <div id="homeHead" className="flex justify-between items-center">
            <div>
              <div className="dashBreadcrumb">
                Pages <i className="fa-regular fa-chevron-right text-[10px] mx-1"></i> <span>Voice</span>
              </div>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
                  <i className="fa-regular fa-microphone-lines text-[var(--accent)]"></i> Voice
                </h1>
                <span id="tierName" style={{ color: getTierColor(user.Tier), backgroundColor: `${getTierColor(user.Tier)}80` }}>{user.Tier}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {Thoughts.length + sortedFolders.length > 1 && (
                <SearchBox value={brainDumpSearch} onChange={(e) => setBrainDumpSearch(e.target.value)} placeholder="Search thoughts and folders" />
              )}
              <TopProfileTile />
            </div>
          </div>

          {!dictation.supported && (
            <p className="voiceUnsupportedNote">
              <i className="fa-regular fa-triangle-exclamation"></i> Voice dictation isn&apos;t supported in this browser. Try Chrome or Edge to dictate voice notes.
            </p>
          )}

          <div id="dashLayout" className="flex justify-between w-full mt-5">
            <div id="layoutLeft" className="w-full">

              <section className="dashBody w-full">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center flex-wrap gap-2 justify-between lg:justify-between">
                    <h2 className="text-2xl flex items-center gap-2">
                      <i className="fa-regular fa-brain text-[var(--accent)]"></i>
                      Your Brain Dump
                    </h2>
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                      {Thoughts.length + sortedFolders.length > 1 && (
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
                      <button type="button" className="statTile statTileAction quickActionButton" onClick={() => setShowAddFolderModal(true)}>
                        <div className="statTileValue text-lg">New Folder</div>
                        <div className="statTileIcon"><i className="fa-regular fa-folder-plus"></i></div>
                      </button>
                    </div>
                  </div>
                </div>

                {Thoughts.length === 0 && sortedFolders.length === 0 ? (
                  <div className="emptyState">
                    <EmptyStateArt size={120} className="emptyStateArt" />
                    <p>No thoughts or folders yet — start your first brain dump.</p>
                    <button type="button" className="emptyStateAction" onClick={() => addThoughtModal()}>Create a thought</button>
                  </div>
                ) : allVoiceUsed && sortedFolders.length === 0 && !brainDumpSearch.trim() ? (
                  <div className="emptyState">
                    <EmptyStateArt size={120} className="emptyStateArt" />
                    <p>Every thought already has a voice note — nice work! New thoughts will show up here until you dictate one.</p>
                    <button type="button" className="emptyStateAction" onClick={() => addThoughtModal()}>New Thought</button>
                  </div>
                ) : searchedThoughts.length === 0 && searchedFolders.length === 0 ? (
                  <div className="emptyState">
                    <EmptyStateArt size={120} className="emptyStateArt" />
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
                                  <i onClick={(e) => { e.preventDefault(); e.stopPropagation(); favoriteThought(f.ThoughtID, !f.Favorite); }} className={`text-xl cursor-pointer ${f.Favorite ? "fa-solid fa-heart text-red-500" : "fa-regular fa-heart"}`} />
                                  <i onClick={(e) => { e.preventDefault(); e.stopPropagation(); infoThoughtModal(f); }} className="text-xl cursor-pointer fa-regular fa-circle-info" />
                                </div>
                              </div>
                              <div className="thoughtName">{f.ThoughtName}</div>
                              <div className="flex flex-col items-center gap-1">
                                <div className="text-lg">{f.ThoughtDescr}</div>
                                <div className="thoughtMeta text-xs text-slate-400">{formatRelativeTime(f.DateCreated)}</div>
                              </div>
                              {renderDictationPanel(f, { overlay: true })}
                              {dictationSentId === f.ThoughtID && (
                                <div className="voiceDictationSuccess voiceDictationSuccessOverlay"><i className="fa-solid fa-circle-check"></i> Voice note added</div>
                              )}
                              <div className="thoughtFoot flex items-center justify-end w-full mt-5">
                                <div className="thoughtFunctions flex items-center justify-end w-full gap-1">
                                  {micIcon(f)}
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
                            <div key={i} className="flex flex-col gap-2 w-full">
                              <Link to={`/thought/${encodeURIComponent(f.ThoughtName)}`} className="thoughtRow w-full flex items-center gap-4">
                                <i onClick={(e) => { e.preventDefault(); e.stopPropagation(); pinThought(f.ThoughtID, !f.Pinned); }} className={`text-lg cursor-pointer ${f.Pinned ? "fa-solid fa-thumbtack-angle text-[var(--accent)]" : "fa-regular fa-thumbtack-angle"}`}></i>
                                <div className="flex-1 min-w-0">
                                  <div className="thoughtName truncate">{f.ThoughtName}</div>
                                  <div className="text-sm text-slate-400 truncate">{f.ThoughtDescr}</div>
                                </div>
                                <span className="thoughtMeta text-xs text-slate-500 shrink-0">{formatRelativeTime(f.DateCreated)}</span>
                                <i onClick={(e) => { e.preventDefault(); e.stopPropagation(); favoriteThought(f.ThoughtID, !f.Favorite); }} className={`text-lg cursor-pointer ${f.Favorite ? "fa-solid fa-heart text-red-500" : "fa-regular fa-heart"}`} />
                                <i onClick={(e) => { e.preventDefault(); e.stopPropagation(); infoThoughtModal(f); }} className="text-lg cursor-pointer fa-regular fa-circle-info" />
                                {micIcon(f, "text-lg")}
                                <i onClick={(e) => { e.preventDefault(); e.stopPropagation(); editSingleThought(f); }} className="text-lg fa-solid fa-cog cursor-pointer hover:text-blue-200"></i>
                                <i onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteThoughtModal(f); }} className="text-lg fa-solid fa-trash cursor-pointer text-red-500 hover:text-red-200"></i>
                              </Link>
                              {renderDictationPanel(f)}
                              {dictationSentId === f.ThoughtID && (
                                <div className="voiceDictationSuccess"><i className="fa-solid fa-circle-check"></i> Voice note added</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

            </div>
          </div>
          {error && <p className="text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default Voice;
