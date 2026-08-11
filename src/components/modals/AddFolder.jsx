import ReactModal from 'react-modal';
import { useState } from 'react';

function AddFolderModal({ isOpen, onClose, onConfirm }) {
  const [folderName, setFolderName] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    setFolderName("");
    setError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmed = folderName.trim();
    if (!trimmed) {
      setError("Folder name is required.");
      return;
    }
    if (trimmed.length > 100) {
      setError("Folder name must be 100 characters or fewer.");
      return;
    }

    const result = await onConfirm(trimmed);
    if (result?.success === false) {
      setError(result.error || "Something went wrong. Please try again.");
      return;
    }

    setFolderName("");
    setError("");
    onClose();
  };

  return (
    <ReactModal
      id="addFolderModal"
      className="modal"
      isOpen={isOpen}
      onRequestClose={handleClose}
      ariaHideApp={false}
      contentLabel="New Folder"
    >
      <i className="fa-solid fa-xmark modalClose" onClick={handleClose}></i>

      <div className="modalHeader">
        <div className="modalIconBadge">
          <i className="fa-regular fa-folder-plus"></i>
        </div>
        <h2 className="modalTitle">New Folder</h2>
        <p className="modalSubtitle">Give your folder a name. You can sort thoughts into it afterward.</p>
      </div>

      <form onSubmit={handleSubmit} className="modalForm">
        <div className="modalFieldGroup">
          <label className="modalFieldLabel" htmlFor="addFolderName">Folder Name</label>
          <input
            id="addFolderName"
            className="modalFieldInput"
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="e.g. Work ideas"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button id="addFolderBtn" className="modalPrimaryButton" type="submit">
          Create Folder
        </button>
        <hr className="modalDivider" />
        <button id="cancelAction" className="modalTextLink" onClick={handleClose} type="button">
          Cancel
        </button>
      </form>
    </ReactModal>
  );
}

export default AddFolderModal;
