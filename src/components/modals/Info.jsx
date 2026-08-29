import ReactModal from "react-modal";
import { useState, useEffect } from "react";

function InfoModal({ isOpen, onClose, thought, token, onSave, onDelete }) {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [thoughtName, setThoughtName] = useState("");
  const [thoughtDescr, setThoughtDescr] = useState("");
  const [error, setError] = useState("");

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [allCategories, setAllCategories] = useState([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const [showAddTag, setShowAddTag] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [allTags, setAllTags] = useState([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  useEffect(() => {
    if (!thought) return;
    setThoughtName(thought.ThoughtName || "");
    setThoughtDescr(thought.ThoughtDescr || "");
    setError("");
    setShowAddCategory(false);
    setShowAddTag(false);
    setCategorySearch("");
    setTagSearch("");
    setCategoryDropdownOpen(false);
    setTagDropdownOpen(false);
  }, [thought]);

  useEffect(() => {
    if (!thought || !isOpen) return;

    const fetchData = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/categories/${thought.ThoughtID}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/tags/${thought.ThoughtID}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const catData = await catRes.json();
        const tagData = await tagRes.json();

        if (catData.success) setCategories(catData.categories);
        if (tagData.success) setTags(tagData.tags);
      } catch (err) {
        console.error("Error fetching categories/tags:", err);
      }
    };

    fetchData();
  }, [thought, isOpen, token]);

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleSave = async () => {
    if (!thought) return;

    if (!thoughtName.trim() || !thoughtDescr.trim()) {
      setError("Thought name and description are both required.");
      return;
    }

    const result = await onSave(thought.ThoughtID, thoughtName, thoughtDescr);
    if (result?.success === false) {
      setError(result.error || "Something went wrong. Please try again.");
      return;
    }

    setError("");
    onClose();
  };

  const toggleAddCategory = async () => {
    const next = !showAddCategory;
    setShowAddCategory(next);
    setCategorySearch("");
    setCategoryDropdownOpen(false);
    if (next) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setAllCategories(data.categories);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    }
  };

  const toggleAddTag = async () => {
    const next = !showAddTag;
    setShowAddTag(next);
    setTagSearch("");
    setTagDropdownOpen(false);
    if (next) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tags`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setAllTags(data.tags);
      } catch (err) {
        console.error("Error fetching tags:", err);
      }
    }
  };

  const attachCategory = async (categoryName) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category: categoryName, ThoughtID: thought.ThoughtID }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) => [...prev, { CategoryID: data.CategoryID, CategoryName: categoryName }]);
        setAllCategories((prev) =>
          prev.some((c) => c.CategoryName.toLowerCase() === categoryName.toLowerCase())
            ? prev
            : [...prev, { CategoryName: categoryName, ThoughtCount: 1, Pinned: false }]
        );
        setCategorySearch("");
      } else {
        setError(data.error || "Failed to add category");
      }
    } catch (err) {
      console.error("Error adding category:", err);
      setError("An error occurred while adding the category.");
    }
  };

  const attachTag = async (tagName) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tag: tagName, ThoughtID: thought.ThoughtID }),
      });
      const data = await res.json();
      if (data.success) {
        setTags((prev) => [...prev, { TagID: data.TagID, TagName: tagName }]);
        setAllTags((prev) =>
          prev.some((t) => t.TagName.toLowerCase() === tagName.toLowerCase())
            ? prev
            : [...prev, { TagName: tagName, ThoughtCount: 1, Pinned: false }]
        );
        setTagSearch("");
      } else {
        setError(data.error || "Failed to add tag");
      }
    } catch (err) {
      console.error("Error adding tag:", err);
      setError("An error occurred while adding the tag.");
    }
  };

  const removeCategory = async (categoryId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categories/${categoryId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.CategoryID !== categoryId));
      } else {
        setError(data.error || "Failed to remove category");
      }
    } catch (err) {
      console.error("Error removing category:", err);
      setError("An error occurred while removing the category.");
    }
  };

  const removeTag = async (tagId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tags/${tagId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTags((prev) => prev.filter((t) => t.TagID !== tagId));
      } else {
        setError(data.error || "Failed to remove tag");
      }
    } catch (err) {
      console.error("Error removing tag:", err);
      setError("An error occurred while removing the tag.");
    }
  };

  if (!thought) return null;

  const attachedCategoryNames = new Set(categories.map((c) => c.CategoryName.toLowerCase()));
  const categoryQuery = categorySearch.trim().toLowerCase();
  const categoryOptions = allCategories.filter(
    (c) => !attachedCategoryNames.has(c.CategoryName.toLowerCase()) && c.CategoryName.toLowerCase().includes(categoryQuery)
  );
  const categoryExists = allCategories.some((c) => c.CategoryName.toLowerCase() === categoryQuery);
  const showCategoryDropdown = categoryDropdownOpen && (categoryOptions.length > 0 || categoryQuery.length > 0);

  const attachedTagNames = new Set(tags.map((t) => t.TagName.toLowerCase()));
  const tagQuery = tagSearch.trim().toLowerCase();
  const tagOptions = allTags.filter(
    (t) => !attachedTagNames.has(t.TagName.toLowerCase()) && t.TagName.toLowerCase().includes(tagQuery)
  );
  const tagExists = allTags.some((t) => t.TagName.toLowerCase() === tagQuery);
  const showTagDropdown = tagDropdownOpen && (tagOptions.length > 0 || tagQuery.length > 0);

  return (
    <ReactModal
      className="modal"
      isOpen={isOpen}
      onRequestClose={handleClose}
      ariaHideApp={false}
      contentLabel="Thought Info"
    >
      <i className="fa-solid fa-xmark modalClose" onClick={handleClose}></i>

      <div className="modalHeader">
        <div className="modalIconBadge">
          <i className="fa-regular fa-circle-info"></i>
        </div>
        <h2 className="modalTitle">Thought Details</h2>
      </div>

      <div className="modalForm">
        <div className="modalFieldGroup">
          <label className="modalFieldLabel" htmlFor="infoThoughtName">Thought Name</label>
          <input
            id="infoThoughtName"
            className="modalFieldInput"
            type="text"
            value={thoughtName}
            onChange={(e) => setThoughtName(e.target.value)}
            placeholder="Thought name"
          />
        </div>

        <div className="modalFieldGroup">
          <label className="modalFieldLabel" htmlFor="infoThoughtDescr">Description</label>
          <textarea
            id="infoThoughtDescr"
            className="modalFieldInput modalFieldTextarea"
            value={thoughtDescr}
            onChange={(e) => setThoughtDescr(e.target.value)}
            placeholder="Thought description"
          />
        </div>

        <div className="modalFieldGroup">
          <div className="modalFieldLabelRow">
            <label className="modalFieldLabel">Categories</label>
            <button type="button" className="modalInlineAddBtn" onClick={toggleAddCategory} aria-label={showAddCategory ? "Close add category" : "Add category"}>
              <i className={`fa-solid ${showAddCategory ? "fa-xmark" : "fa-plus"}`}></i>
            </button>
          </div>
          {categories.length > 0 ? (
            <div className="modalChipRow">
              {categories.map((c) => (
                <span key={c.CategoryID} className="modalChip modalChipRemovable">
                  {c.CategoryName}
                  <i className="fa-solid fa-xmark" onClick={() => removeCategory(c.CategoryID)}></i>
                </span>
              ))}
            </div>
          ) : (
            <p className="modalEmptyNote">No categories added</p>
          )}
          {showAddCategory && (
            <div className="modalComboBox">
              <input
                type="text"
                className="modalFieldInput"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                onFocus={() => setCategoryDropdownOpen(true)}
                onBlur={() => setCategoryDropdownOpen(false)}
                placeholder="Search or create a category"
              />
              {showCategoryDropdown && (
                <div className="modalComboBoxDropdown">
                  {categoryOptions.map((c) => (
                    <button type="button" key={c.CategoryName} className="modalComboBoxOption" onMouseDown={(e) => e.preventDefault()} onClick={() => attachCategory(c.CategoryName)}>
                      {c.CategoryName}
                    </button>
                  ))}
                  {categoryQuery && !categoryExists && (
                    <button type="button" className="modalComboBoxOption modalComboBoxOptionNew" onMouseDown={(e) => e.preventDefault()} onClick={() => attachCategory(categorySearch.trim())}>
                      <i className="fa-solid fa-plus"></i> Create &quot;{categorySearch.trim()}&quot;
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modalFieldGroup">
          <div className="modalFieldLabelRow">
            <label className="modalFieldLabel">Tags</label>
            <button type="button" className="modalInlineAddBtn" onClick={toggleAddTag} aria-label={showAddTag ? "Close add tag" : "Add tag"}>
              <i className={`fa-solid ${showAddTag ? "fa-xmark" : "fa-plus"}`}></i>
            </button>
          </div>
          {tags.length > 0 ? (
            <div className="modalChipRow">
              {tags.map((t) => (
                <span key={t.TagID} className="modalChip modalChipRemovable">
                  {t.TagName}
                  <i className="fa-solid fa-xmark" onClick={() => removeTag(t.TagID)}></i>
                </span>
              ))}
            </div>
          ) : (
            <p className="modalEmptyNote">No tags added</p>
          )}
          {showAddTag && (
            <div className="modalComboBox">
              <input
                type="text"
                className="modalFieldInput"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                onFocus={() => setTagDropdownOpen(true)}
                onBlur={() => setTagDropdownOpen(false)}
                placeholder="Search or create a tag"
              />
              {showTagDropdown && (
                <div className="modalComboBoxDropdown">
                  {tagOptions.map((t) => (
                    <button type="button" key={t.TagName} className="modalComboBoxOption" onMouseDown={(e) => e.preventDefault()} onClick={() => attachTag(t.TagName)}>
                      {t.TagName}
                    </button>
                  ))}
                  {tagQuery && !tagExists && (
                    <button type="button" className="modalComboBoxOption modalComboBoxOptionNew" onMouseDown={(e) => e.preventDefault()} onClick={() => attachTag(tagSearch.trim())}>
                      <i className="fa-solid fa-plus"></i> Create &quot;{tagSearch.trim()}&quot;
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button type="button" className="modalPrimaryButton" onClick={handleSave}>
          Save Changes
        </button>
        <hr className="modalDivider" />
        <button type="button" className="modalTextLink" onClick={handleClose}>
          Close
        </button>
        {onDelete && (
          <button type="button" className="modalTextLink modalTextLinkDanger" onClick={onDelete}>
            <i className="fa-regular fa-trash"></i> Delete Thought
          </button>
        )}
      </div>
    </ReactModal>
  );
}

export default InfoModal;
