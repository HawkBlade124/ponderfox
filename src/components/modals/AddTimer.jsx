import ReactModal from 'react-modal';
import { useState } from 'react';

function AddTimerModal({ isOpen, onClose, onConfirm }) {
  const [timerName, setTimerName] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("25");
  const [seconds, setSeconds] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!timerName.trim()) {
      setError("Give your timer a name.");
      return;
    }

    const totalSeconds =
      (Number(hours) || 0) * 3600 + (Number(minutes) || 0) * 60 + (Number(seconds) || 0);

    if (totalSeconds <= 0) {
      setError("Set a duration greater than zero.");
      return;
    }
    if (totalSeconds > 359999) {
      setError("Duration must be under 100 hours.");
      return;
    }

    const result = await onConfirm(timerName, totalSeconds);
    if (result?.success === false) {
      setError(result.error || "Something went wrong. Please try again.");
      return;
    }

    setTimerName("");
    setHours("");
    setMinutes("25");
    setSeconds("");
    setError("");
    onClose();
  };

  return (
    <ReactModal
      id="addTimerModal"
      className="modal"
      isOpen={isOpen}
      onRequestClose={handleClose}
      ariaHideApp={false}
      contentLabel="New Timer"
    >
      <i className="fa-solid fa-xmark modalClose" onClick={handleClose}></i>

      <div className="modalHeader">
        <div className="modalIconBadge">
          <i className="fa-regular fa-stopwatch"></i>
        </div>
        <h2 className="modalTitle">New Timer</h2>
        <p className="modalSubtitle">Name it and set how much time is left.</p>
      </div>

      <form onSubmit={handleSubmit} className="modalForm">
        <div className="modalFieldGroup">
          <label className="modalFieldLabel" htmlFor="addTimerName">Timer Name</label>
          <input
            id="addTimerName"
            className="modalFieldInput"
            type="text"
            value={timerName}
            onChange={(e) => setTimerName(e.target.value)}
            placeholder="e.g. Website Redesign"
            autoFocus
          />
        </div>

        <div className="modalFieldGroup">
          <label className="modalFieldLabel">Duration</label>
          <div className="timerDurationInputs">
            <div className="timerDurationField">
              <input
                className="modalFieldInput"
                type="number"
                min="0"
                max="99"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0"
              />
              <span>hrs</span>
            </div>
            <div className="timerDurationField">
              <input
                className="modalFieldInput"
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="0"
              />
              <span>min</span>
            </div>
            <div className="timerDurationField">
              <input
                className="modalFieldInput"
                type="number"
                min="0"
                max="59"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                placeholder="0"
              />
              <span>sec</span>
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button className="modalPrimaryButton" type="submit">
          Create Timer
        </button>
        <hr className="modalDivider" />
        <button className="modalTextLink" onClick={handleClose} type="button">
          Cancel
        </button>
      </form>
    </ReactModal>
  );
}

export default AddTimerModal;
