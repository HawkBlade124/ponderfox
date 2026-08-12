import { useAuth } from "../../context/AuthContext.jsx";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashMenu from "../../components/DashMenu.jsx";
import PonderFoxMark from "../../components/PonderFoxMark.jsx";
import TopProfileTile from "../../components/TopProfileTile.jsx";
import AddFolderModal from "../../components/modals/AddFolder.jsx";

function Lists() {
  const { user, token, loading } = useAuth();
  const [lists, setLists] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchLists = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLists(data.lists);
      } else {
        setError(data.error || "Failed to load lists");
      }
    } catch (err) {
      console.error("Error fetching lists:", err);
      setError("Failed to load lists");
    }
  };

  useEffect(() => {
    if (loading || !token) return;
    fetchLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, loading]);

  const createList = async (listName) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ list: listName }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchLists();
        return { success: true };
      }
      return { success: false, error: data.details || data.error || "Failed to create list" };
    } catch (err) {
      console.error("Error creating list:", err);
      return { success: false, error: "Could not reach the server. Check your connection and try again." };
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
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

  const sortedLists = [...lists].sort((a, b) => {
    const cmp =
      sortField === "count"
        ? a.ThoughtCount - b.ThoughtCount
        : a.ListName.localeCompare(b.ListName);
    return sortDir === "asc" ? cmp : -cmp;
  });
  const searchedLists = sortedLists.filter((l) =>
    l.ListName.toLowerCase().includes(search.trim().toLowerCase())
  );

  const sortIcon = (field) => {
    if (sortField !== field) return null;
    return <i className={`fa-regular ${sortDir === "asc" ? "fa-arrow-up" : "fa-arrow-down"}`}></i>;
  };

  return (
    <div id="dashboard" className="w-full">
      <div id="dashWrap" className="flex w-full">
        <DashMenu />
        <div className="rightScreen w-full p-6 ml">
          <div id="homeHead" className="flex justify-between items-center">
            <div>
              <div className="dashBreadcrumb">Pages <i className="fa-regular fa-chevron-right text-[10px] mx-1"></i> <span>Lists</span></div>
              <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
                <i className="fa-regular fa-list-tree text-[#438eef]"></i> Lists
              </h1>
            </div>
            <TopProfileTile />
          </div>

          <div className="adminActionBar mt-5">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="bg-[#438eef] hover:bg-[#2f7ae0] transition text-white font-semibold h-11 px-5 rounded-lg cursor-pointer flex items-center gap-2"
            >
              <i className="fa-regular fa-plus"></i> New List
            </button>
          </div>

          <div className="adminFilterBar">
            <div className="adminFilterField">
              <label htmlFor="listsFilterTitle">Title</label>
              <input
                id="listsFilterTitle"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by list name"
              />
            </div>
            <button type="button" className="adminFilterClear" onClick={() => setSearch("")}>
              Clear
            </button>
          </div>

          {lists.length === 0 ? (
            <section className="dashBody w-full mt-5">
              <div className="emptyState">
                <PonderFoxMark size={120} className="emptyStateArt" />
                <p>No lists yet — open a thought&apos;s Details tab and sort it into a list to create one.</p>
              </div>
            </section>
          ) : searchedLists.length === 0 ? (
            <section className="dashBody w-full mt-5">
              <div className="emptyState">
                <PonderFoxMark size={120} className="emptyStateArt" />
                <p>Nothing matches &quot;{search}&quot;.</p>
                <button type="button" className="emptyStateAction" onClick={() => setSearch("")}>Clear search</button>
              </div>
            </section>
          ) : (
            <div className="adminTableWrap">
              <table className="adminTable">
                <thead>
                  <tr>
                    <th className="adminTableSortable" onClick={() => handleSort("name")}>
                      List Name {sortIcon("name")}
                    </th>
                    <th className="adminTableSortable" onClick={() => handleSort("count")}>
                      Thoughts {sortIcon("count")}
                    </th>
                    <th>Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {searchedLists.map((l) => (
                    <tr key={l.ListName}>
                      <td>
                        <Link to={`/thoughts/${encodeURIComponent(l.ListName)}`} className="adminTableNameCell">
                          {l.ListName}
                        </Link>
                      </td>
                      <td>{l.ThoughtCount} {l.ThoughtCount === 1 ? "thought" : "thoughts"}</td>
                      <td>
                        <Link to={`/thoughts/${encodeURIComponent(l.ListName)}`} className="adminTableOpButton">
                          Open <i className="fa-regular fa-arrow-right"></i>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      </div>

      <AddFolderModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onConfirm={(listName) => createList(listName)}
      />
    </div>
  );
}

export default Lists;
