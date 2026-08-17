import { useAuth } from "../context/AuthContext.jsx";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PonderFoxMark from "./PonderFoxMark.jsx";
import AddFolderModal from "./modals/AddFolder.jsx";
import DeleteModal from "./modals/Delete.jsx";

// Renders one tab's worth of content on the Organize page — Lists, Tags, and
// Categories are all "a name plus a thought count" backed by near-identical
// API shapes (GET /api/{apiBase}, POST /api/{apiBase}, DELETE .../by-name/:name,
// PUT .../by-name/:name/pin). `search` is controlled by the parent so a single
// search box can filter whichever tab is active.
function EntityList({
  icon,
  singular,
  plural,
  apiBase,
  nameField,
  createKey,
  linkTo,
  newButtonLabel,
  modalTitle,
  modalIcon,
  modalSubtitle,
  modalFieldLabel,
  modalPlaceholder,
  modalSubmitLabel,
  emptyMessage,
  search,
}) {
  const { token, loading } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const pluralLower = plural.toLowerCase();
  const singularLower = singular.toLowerCase();

  const fetchItems = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${apiBase}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setItems(data[apiBase]);
      } else {
        setError(data.error || `Failed to load ${pluralLower}`);
      }
    } catch (err) {
      console.error(`Error fetching ${pluralLower}:`, err);
      setError(`Failed to load ${pluralLower}`);
    }
  };

  useEffect(() => {
    if (loading || !token) return;
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, loading]);

  const createItem = async (name) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${apiBase}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [createKey]: name }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchItems();
        return { success: true };
      }
      return { success: false, error: data.details || data.error || `Failed to create ${singularLower}` };
    } catch (err) {
      console.error(`Error creating ${singularLower}:`, err);
      return { success: false, error: "Could not reach the server. Check your connection and try again." };
    }
  };

  const deleteItem = async (name) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${apiBase}/by-name/${encodeURIComponent(name)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setItems((prev) => prev.filter((i) => i[nameField] !== name));
      } else {
        setError(data.error || `Failed to delete ${singularLower}`);
      }
    } catch (err) {
      console.error(`Error deleting ${singularLower}:`, err);
      setError(`Failed to delete ${singularLower}`);
    }
  };

  const confirmDelete = (item) => {
    setPendingDelete(item);
    setShowDeleteModal(true);
  };

  const togglePin = async (item) => {
    const name = item[nameField];
    const nextPinned = !item.Pinned;
    setItems((prev) => prev.map((i) => (i[nameField] === name ? { ...i, Pinned: nextPinned } : i)));
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/${apiBase}/by-name/${encodeURIComponent(name)}/pin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ Pinned: nextPinned }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setItems((prev) => prev.map((i) => (i[nameField] === name ? { ...i, Pinned: !nextPinned } : i)));
        setError(data.error || `Failed to update ${singularLower}`);
      }
    } catch (err) {
      console.error(`Error pinning ${singularLower}:`, err);
      setItems((prev) => prev.map((i) => (i[nameField] === name ? { ...i, Pinned: !nextPinned } : i)));
      setError(`Failed to update ${singularLower}`);
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    const pinDiff = Number(b.Pinned) - Number(a.Pinned);
    if (pinDiff !== 0) return pinDiff;
    const cmp =
      sortField === "count"
        ? a.ThoughtCount - b.ThoughtCount
        : a[nameField].localeCompare(b[nameField]);
    return sortDir === "asc" ? cmp : -cmp;
  });
  const searchedItems = sortedItems.filter((i) =>
    i[nameField].toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <>
      <section className="dashBody w-full mt-5">
        <div className="flex items-center flex-wrap gap-2 justify-between">
          <h2 className="text-2xl flex items-center gap-2">
            <i className={icon}></i> {plural}
          </h2>
          <div className="flex items-center gap-2">
            {items.length > 1 && (
              <select
                className="sortSelect"
                value={`${sortField}-${sortDir}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split("-");
                  setSortField(field);
                  setSortDir(dir);
                }}
              >
                <option value="name-asc">Name (A–Z)</option>
                <option value="name-desc">Name (Z–A)</option>
                <option value="count-desc">Most thoughts</option>
                <option value="count-asc">Fewest thoughts</option>
              </select>
            )}
            <button type="button" className="statTile statTileAction quickActionButton" onClick={() => setShowAddModal(true)}>
              <div className="statTileValue text-lg">{newButtonLabel}</div>
              <div className="statTileIcon"><i className="fa-regular fa-plus"></i></div>
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="emptyState">
            <PonderFoxMark size={120} className="emptyStateArt" />
            <p>{emptyMessage}</p>
          </div>
        ) : searchedItems.length === 0 ? (
          <div className="emptyState">
            <PonderFoxMark size={120} className="emptyStateArt" />
            <p>Nothing matches &quot;{search}&quot;.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full mt-5">
            {searchedItems.map((item) => {
              const name = item[nameField];
              const rowInner = (
                <>
                  <i
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePin(item); }}
                    className={`text-lg cursor-pointer ${item.Pinned ? "fa-solid fa-thumbtack-angle text-[var(--accent)]" : "fa-regular fa-thumbtack-angle text-slate-400"}`}
                  ></i>
                  <div className="flex-1 min-w-0">
                    <div className="thoughtName truncate">{name}</div>
                    <div className="text-sm text-slate-400 truncate">
                      {item.ThoughtCount} {item.ThoughtCount === 1 ? "thought" : "thoughts"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <i
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); confirmDelete(item); }}
                      className="text-lg cursor-pointer fa-solid fa-trash text-red-500 hover:text-red-200"
                    ></i>
                    {linkTo && <i className="fa-regular fa-chevron-right text-sm text-slate-500"></i>}
                  </div>
                </>
              );

              return linkTo ? (
                <Link key={name} to={linkTo(name)} className="thoughtRow w-full flex items-center gap-4">
                  {rowInner}
                </Link>
              ) : (
                <div key={name} className="thoughtRow w-full flex items-center gap-4">
                  {rowInner}
                </div>
              );
            })}
          </div>
        )}
      </section>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <AddFolderModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onConfirm={(name) => createItem(name)}
        title={modalTitle}
        icon={modalIcon}
        subtitle={modalSubtitle}
        fieldLabel={modalFieldLabel}
        placeholder={modalPlaceholder}
        submitLabel={modalSubmitLabel}
        entityLabel={singular}
      />

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        itemName={pendingDelete?.[nameField]}
        title={`Delete ${singular}?`}
        confirmLabel={`Delete ${singular}`}
        onConfirm={() => pendingDelete && deleteItem(pendingDelete[nameField])}
      />
    </>
  );
}

export default EntityList;
