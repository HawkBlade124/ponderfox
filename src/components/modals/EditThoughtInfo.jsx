import ReactModal from "react-modal";
import { useState, useEffect } from "react";

function EditThoughtInfoModal({ isOpen, onClose, thoughtName, thoughtDescr, onSave, onDelete }) {
  const [name, setName] = useState("");
  const [descr, setDescr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(thoughtName || "");
      setDescr(thoughtDescr || "");
    }
  }, [isOpen, thoughtName, thoughtDescr]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), descr.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ReactModal
      className="modal"
      isOpen={isOpen}
      onRequestClose={onClose}
      ariaHideApp={false}
      contentLabel="Thought Settings"
    >
      <i className="fa-solid fa-xmark modalClose" onClick={onClose}></i>

      <div className="modalHeader">
        <div className="modalIconBadge">
          <i className="fa-solid fa-cog"></i>
        </div>
        <h2 className="modalTitle">Thought Settings</h2>
        <p className="modalSubtitle">Rename this thought or update its description.</p>
      </div>

      <form onSubmit={handleSubmit} className="modalForm">
        <div className="modalFieldGroup">
          <label className="modalFieldLabel" htmlFor="thoughtSettingsName">Thought Name</label>
          <input
            id="thoughtSettingsName"
            className="modalFieldInput"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Thought name"
            required
          />
        </div>

        <div className="modalFieldGroup">
          <label className="modalFieldLabel" htmlFor="thoughtSettingsDescr">Description</label>
          <textarea
            id="thoughtSettingsDescr"
            className="modalFieldInput modalFieldTextarea"
            value={descr}
            onChange={(e) => setDescr(e.target.value)}
            placeholder="Thought description"
          />
        </div>

        <button type="submit" className="modalPrimaryButton" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <hr className="modalDivider" />
        <button type="button" className="modalTextLink" onClick={onClose}>
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

export default EditThoughtInfoModal;
