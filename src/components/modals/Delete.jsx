import ReactModal from 'react-modal';

function DeleteModal({
  isOpen,
  onClose,
  thought,
  itemName,
  title = "Delete Thought?",
  confirmLabel = "Delete Thought",
  onConfirm,
}) {
  const name = itemName ?? thought?.ThoughtName;

  return (
    <ReactModal
      id="deleteModal"
      className="modal"
      isOpen={isOpen}
      onRequestClose={onClose}
      ariaHideApp={false}
      contentLabel={title}
    >
      <i className="fa-solid fa-xmark modalClose" onClick={onClose}></i>

      <div className="modalHeader">
        <div className="modalIconBadge modalIconBadgeDanger">
          <i className="fa-solid fa-trash"></i>
        </div>
        <h2 className="modalTitle">{title}</h2>
        <p className="modalSubtitle">
          Are you sure you want to delete <strong>{name}</strong>? This can't be undone.
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
          {confirmLabel}
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
