import ReactModal from 'react-modal';

function LogoutConfirmModal({ isOpen, onClose, onConfirm }) {
  return (
    <ReactModal
      id="logoutConfirmModal"
      className="modal"
      isOpen={isOpen}
      onRequestClose={onClose}
      ariaHideApp={false}
      contentLabel="Log out?"
    >
      <i className="fa-solid fa-xmark modalClose" onClick={onClose}></i>

      <div className="modalHeader">
        <div className="modalIconBadge">
          <i className="fa-regular fa-arrow-right-from-bracket"></i>
        </div>
        <h2 className="modalTitle">Log out?</h2>
        <p className="modalSubtitle">Are you sure you want to log out?</p>
      </div>

      <div className="modalForm">
        <button
          className="modalPrimaryButton"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          Log Out
        </button>
        <hr className="modalDivider" />
        <button className="modalTextLink" onClick={onClose}>
          Cancel
        </button>
      </div>
    </ReactModal>
  );
}

export default LogoutConfirmModal;
