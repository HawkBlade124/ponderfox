import ReactModal from 'react-modal';
import { useState } from 'react';

function AddModal({ isOpen, onClose, onConfirm }) {
  const [thoughtName, setThoughtName] = useState("");
  const [thoughtDescr, setThoughtDescr] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!thoughtName.trim() || !thoughtDescr.trim()) {
      setError("Thought name and description are both required.");
      return;
    }

    const result = await onConfirm(thoughtName, thoughtDescr);
    if (result?.success === false) {
      setError(result.error || "Something went wrong. Please try again.");
      return;
    }

    setThoughtName("");
    setThoughtDescr("");
    setError("");
    onClose();
  };

  return (
    <ReactModal
      id="addModal"
      className="modal"
      isOpen={isOpen}
      onRequestClose={handleClose}
      ariaHideApp={false}
      contentLabel="New Thought Group"
    >
      <i className="fa-solid fa-xmark modalClose" onClick={handleClose}></i>

      <div className="modalHeader">
        <div className="modalIconBadge">
          <i className="fa-regular fa-message-plus"></i>
        </div>
        <h2 className="modalTitle">New Thought Group</h2>
        <p className="modalSubtitle">Give your thought a name and a short description.</p>
      </div>

      <form onSubmit={handleSubmit} className="modalForm">
        <div className="modalFieldGroup">
          <label className="modalFieldLabel" htmlFor="addThoughtName">Thought Name</label>
          <input
            id="addThoughtName"
            className="modalFieldInput"
            type="text"
            value={thoughtName}
            onChange={(e) => setThoughtName(e.target.value)}
            placeholder="e.g. Weekend plans"
          />
        </div>
        <div className="modalFieldGroup">
          <label className="modalFieldLabel" htmlFor="addThoughtDescr">Description</label>
          <textarea
            id="addThoughtDescr"
            className="modalFieldInput modalFieldTextarea"
            value={thoughtDescr}
            onChange={(e) => setThoughtDescr(e.target.value)}
            placeholder="What's this thought about?"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button id="addthoughtBtn" className="modalPrimaryButton" type="submit">
          Add Thought
        </button>
        <hr className="modalDivider" />
        <button id="cancelAction" className="modalTextLink" onClick={handleClose} type="button">
          Cancel
        </button>
      </form>
    </ReactModal>
  );
}

export default AddModal;
