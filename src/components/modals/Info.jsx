import ReactModal from "react-modal";
import { useState, useEffect } from "react";

function InfoModal({ isOpen, onClose, thought, token }) {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

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

  if (!thought) return null;

  return (
    <ReactModal
      className="modal"
      isOpen={isOpen}
      onRequestClose={onClose}
      ariaHideApp={false}
      contentLabel="Thought Info"
    >
      <i className="fa-solid fa-xmark modalClose" onClick={onClose}></i>

      <div className="modalHeader">
        <div className="modalIconBadge">
          <i className="fa-regular fa-circle-info"></i>
        </div>
        <h2 className="modalTitle">{thought.ThoughtName}</h2>
        {thought.ThoughtDescr && <p className="modalSubtitle">{thought.ThoughtDescr}</p>}
      </div>

      <div className="modalForm">
        <div className="modalFieldGroup">
          <label className="modalFieldLabel">Categories</label>
          {categories.length > 0 ? (
            <div className="modalChipRow">
              {categories.map((c) => (
                <span key={c.CategoryID} className="modalChip">{c.CategoryName}</span>
              ))}
            </div>
          ) : (
            <p className="modalEmptyNote">No categories added</p>
          )}
        </div>

        <div className="modalFieldGroup">
          <label className="modalFieldLabel">Tags</label>
          {tags.length > 0 ? (
            <div className="modalChipRow">
              {tags.map((t) => (
                <span key={t.TagID} className="modalChip">{t.TagName}</span>
              ))}
            </div>
          ) : (
            <p className="modalEmptyNote">No tags added</p>
          )}
        </div>

        <button type="button" className="modalPrimaryButton" onClick={onClose}>
          Close
        </button>
      </div>
    </ReactModal>
  );
}

export default InfoModal;
