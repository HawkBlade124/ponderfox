import ReactModal from 'react-modal';
import { useState } from 'react';

function AddMoodBoardModal({ isOpen, onClose, onConfirm }) {
  const [boardName, setBoardName] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!boardName.trim()) {
      setError("Board name is required.");
      return;
    }

    const result = await onConfirm(boardName);
    if (result?.success === false) {
      setError(result.error || "Something went wrong. Please try again.");
      return;
    }

    setBoardName("");
    setError("");
    onClose();
  };

  return (
    <ReactModal
      id="addMoodBoardModal"
      className="modal"
      isOpen={isOpen}
      onRequestClose={handleClose}
      ariaHideApp={false}
      contentLabel="New Mood Board"
    >
      <i className="fa-solid fa-xmark modalClose" onClick={handleClose}></i>

      <div className="modalHeader">
        <div className="modalIconBadge">
          <i className="fa-regular fa-game-board"></i>
        </div>
        <h2 className="modalTitle">New Mood Board</h2>
        <p className="modalSubtitle">Give your mood board a name to get started.</p>
      </div>

      <form onSubmit={handleSubmit} className="modalForm">
        <div className="modalFieldGroup">
          <label className="modalFieldLabel" htmlFor="addMoodBoardName">Board Name</label>
          <input
            id="addMoodBoardName"
            className="modalFieldInput"
            type="text"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            placeholder="e.g. Cozy Autumn Vibes"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button className="modalPrimaryButton" type="submit">
          Create Mood Board
        </button>
        <hr className="modalDivider" />
        <button className="modalTextLink" onClick={handleClose} type="button">
          Cancel
        </button>
      </form>
    </ReactModal>
  );
}

export default AddMoodBoardModal;
