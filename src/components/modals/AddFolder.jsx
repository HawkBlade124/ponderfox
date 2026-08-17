import ReactModal from 'react-modal';
import { useState } from 'react';

function AddFolderModal({
  isOpen,
  onClose,
  onConfirm,
  title = "New Folder",
  icon = "fa-regular fa-folder-plus",
  subtitle = "Give your folder a name. You can sort thoughts into it afterward.",
  fieldLabel = "Folder Name",
  placeholder = "e.g. Work ideas",
  submitLabel = "Create Folder",
  entityLabel = "Folder",
}) {
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
      setError(`${entityLabel} name is required.`);
      return;
    }
    if (trimmed.length > 100) {
      setError(`${entityLabel} name must be 100 characters or fewer.`);
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
      contentLabel={title}
    >
      <i className="fa-solid fa-xmark modalClose" onClick={handleClose}></i>

      <div className="modalHeader">
        <div className="modalIconBadge">
          <i className={icon}></i>
        </div>
        <h2 className="modalTitle">{title}</h2>
        <p className="modalSubtitle">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="modalForm">
        <div className="modalFieldGroup">
          <label className="modalFieldLabel" htmlFor="addFolderName">{fieldLabel}</label>
          <input
            id="addFolderName"
            className="modalFieldInput"
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder={placeholder}
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button id="addFolderBtn" className="modalPrimaryButton" type="submit">
          {submitLabel}
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
