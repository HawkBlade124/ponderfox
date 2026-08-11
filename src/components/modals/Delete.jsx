import ReactModal from 'react-modal';

function DeleteModal({ isOpen, onClose, thought, onConfirm }) {
  return (
    <ReactModal
      id="deleteModal"
      className="modal"
      isOpen={isOpen}
      onRequestClose={onClose}
      ariaHideApp={false}
      contentLabel="Delete Thought"
    >
      <i className="fa-solid fa-xmark modalClose" onClick={onClose}></i>

      <div className="modalHeader">
        <div className="modalIconBadge modalIconBadgeDanger">
          <i className="fa-solid fa-trash"></i>
        </div>
        <h2 className="modalTitle">Delete Thought?</h2>
        <p className="modalSubtitle">
          Are you sure you want to delete <strong>{thought?.ThoughtName}</strong>? This can't be undone.
        </p>
      </div>

      <div className="modalForm">
        <button
          className="modalPrimaryButton modalPrimaryButtonDanger"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          Delete Thought
        </button>
        <hr className="modalDivider" />
        <button className="modalTextLink" onClick={onClose}>
          Cancel
        </button>
      </div>
    </ReactModal>
  );
}

export default DeleteModal;
