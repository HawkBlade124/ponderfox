import ReactModal from "react-modal";
import { useState, useEffect } from "react";

function EditModal({ isOpen, onClose, thought, token, onSave, onDelete }) {
  const [thoughtName, setThoughtName] = useState("");
  const [thoughtDescr, setThoughtDescr] = useState("");
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [addCat, setAddCat] = useState("");
  const [addTag, setAddTag] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!thought) return;

    setThoughtName(thought.ThoughtName || "");
    setThoughtDescr(thought.ThoughtDescr || "");
    setError("");

    // preload categories/tags for this thought
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
        console.error("Error loading categories/tags:", err);
      }
    };

    fetchData();
  }, [thought, token]);

  // add new category to list
  const handleAddCategory = () => {
    if (!addCat.trim()) return;
    setCategories((prev) => [...prev, { CategoryName: addCat.trim() }]);
    setAddCat("");
  };

  // add new tag to list
  const handleAddTag = () => {
    if (!addTag.trim()) return;
    setTags((prev) => [...prev, { TagName: addTag.trim() }]);
    setAddTag("");
  };

  // remove a category - only calls the API if it was already persisted
  // (has a CategoryID); one just added this session simply drops from state
  const handleRemoveCategory = async (index, categoryId) => {
    if (categoryId) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categories/${categoryId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to remove category");
          return;
        }
      } catch (err) {
        console.error("Error removing category:", err);
        setError("An error occurred while removing the category.");
        return;
      }
    }
    setCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveTag = async (index, tagId) => {
    if (tagId) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tags/${tagId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to remove tag");
          return;
        }
      } catch (err) {
        console.error("Error removing tag:", err);
        setError("An error occurred while removing the tag.");
        return;
      }
    }
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!thought) return;

    try {
      const result = await onSave(thought.ThoughtID, thoughtName, thoughtDescr);
      if (result?.success === false) {
        setError(result.error || "Something went wrong. Please try again.");
        return;
      }

      for (const cat of categories) {
        if (!cat.CategoryID) {
          await fetch(`${import.meta.env.VITE_API_URL}/api/categories`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              category: cat.CategoryName,
              ThoughtID: thought.ThoughtID,
            }),
          });
        }
      }

      // push new tags
      for (const tag of tags) {
        if (!tag.TagID) {
          await fetch(`${import.meta.env.VITE_API_URL}/api/tags`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              tag: tag.TagName,
              ThoughtID: thought.ThoughtID,
            }),
          });
        }
      }
    } catch (err) {
      console.error("Error updating thought:", err);
    }

    handleClose();
  };

  if (!thought) return null;

  return (
    <ReactModal
      className="modal"
      isOpen={isOpen}
      onRequestClose={handleClose}
      ariaHideApp={false}
      contentLabel="Edit Thought"
    >
      <i className="fa-solid fa-xmark modalClose" onClick={handleClose}></i>

      <div className="modalHeader">
        <div className="modalIconBadge">
          <i className="fa-solid fa-cog"></i>
        </div>
        <h2 className="modalTitle">Edit Thought</h2>
        <p className="modalSubtitle">Update the details, categories, and tags for this thought.</p>
      </div>

      <form onSubmit={handleSubmit} className="modalForm">
        <div className="modalFieldGroup">
          <label className="modalFieldLabel" htmlFor="editThoughtName">Thought Name</label>
          <input
            id="editThoughtName"
            className="modalFieldInput"
            type="text"
            value={thoughtName}
            onChange={(e) => setThoughtName(e.target.value)}
            placeholder="Thought name"
            required
          />
        </div>

        <div className="modalFieldGroup">
          <label className="modalFieldLabel" htmlFor="editThoughtDescr">Description</label>
          <textarea
            id="editThoughtDescr"
            className="modalFieldInput modalFieldTextarea"
            value={thoughtDescr}
            onChange={(e) => setThoughtDescr(e.target.value)}
            placeholder="Thought description"
          />
        </div>

        <div className="modalFieldGroup">
          <label className="modalFieldLabel">Categories</label>
          {categories.length > 0 && (
            <div className="modalChipRow">
              {categories.map((c, i) => (
                <span key={i} className="modalChip modalChipRemovable">
                  {c.CategoryName}
                  <i className="fa-solid fa-xmark" onClick={() => handleRemoveCategory(i, c.CategoryID)}></i>
                </span>
              ))}
            </div>
          )}
          <div className="modalInlineAdd">
            <input
              type="text"
              className="modalFieldInput"
              value={addCat}
              onChange={(e) => setAddCat(e.target.value)}
              placeholder="New category"
            />
            <button type="button" onClick={handleAddCategory} className="modalInlineAddBtn">
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>

        <div className="modalFieldGroup">
          <label className="modalFieldLabel">Tags</label>
          {tags.length > 0 && (
            <div className="modalChipRow">
              {tags.map((t, i) => (
                <span key={i} className="modalChip modalChipRemovable">
                  {t.TagName}
                  <i className="fa-solid fa-xmark" onClick={() => handleRemoveTag(i, t.TagID)}></i>
                </span>
              ))}
            </div>
          )}
          <div className="modalInlineAdd">
            <input
              type="text"
              className="modalFieldInput"
              value={addTag}
              onChange={(e) => setAddTag(e.target.value)}
              placeholder="New tag"
            />
            <button type="button" onClick={handleAddTag} className="modalInlineAddBtn">
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button type="submit" className="modalPrimaryButton">
          Save All Changes
        </button>
        <hr className="modalDivider" />
        <button type="button" className="modalTextLink" onClick={handleClose}>
          Cancel
        </button>
        {onDelete && (
          <button type="button" className="modalTextLink modalTextLinkDanger" onClick={onDelete}>
            <i className="fa-regular fa-trash"></i> Delete Thought
          </button>
        )}
      </form>
    </ReactModal>
  );
}

export default EditModal;
