import ReactModal from 'react-modal';
import { useState } from 'react';
import { useSpeechDictation } from '../../hooks/useSpeechDictation.js';

function AddModal({ isOpen, onClose, onConfirm }) {
  const [thoughtName, setThoughtName] = useState("");
  const [thoughtDescr, setThoughtDescr] = useState("");
  const [error, setError] = useState("");
  const [usedVoice, setUsedVoice] = useState(false);

  const dictation = useSpeechDictation();
  const [showDictation, setShowDictation] = useState(false);
  const dictationText = `${dictation.transcript} ${dictation.interim}`.trim();

  const resetDictation = () => {
    dictation.reset();
    setShowDictation(false);
  };

  const toggleDictationPanel = () => {
    if (showDictation) {
      resetDictation();
      return;
    }
    setShowDictation(true);
    dictation.start();
  };

  const insertDictation = () => {
    if (!dictationText) return;
    dictation.stop();
    setThoughtDescr((prev) => (prev ? `${prev} ${dictationText}` : dictationText));
    setUsedVoice(true);
    resetDictation();
  };

  const handleClose = () => {
    setError("");
    resetDictation();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!thoughtName.trim() || !thoughtDescr.trim()) {
      setError("Thought name and description are both required.");
      return;
    }

    const result = await onConfirm(thoughtName, thoughtDescr, usedVoice);
    if (result?.success === false) {
      setError(result.error || "Something went wrong. Please try again.");
      return;
    }

    setThoughtName("");
    setThoughtDescr("");
    setUsedVoice(false);
    setError("");
    resetDictation();
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
          <div className="modalFieldLabelRow">
            <label className="modalFieldLabel" htmlFor="addThoughtDescr">Description</label>
            <i
              onClick={toggleDictationPanel}
              className={`cursor-pointer ${showDictation && dictation.listening ? "fa-solid fa-microphone-lines text-[var(--accent)] fa-fade" : "fa-regular fa-microphone-lines"}`}
              title={dictation.supported ? "Dictate your description" : "Voice dictation isn't supported in this browser"}
            ></i>
          </div>
          <textarea
            id="addThoughtDescr"
            className="modalFieldInput modalFieldTextarea"
            value={thoughtDescr}
            onChange={(e) => setThoughtDescr(e.target.value)}
            placeholder="What's this thought about?"
          />
          {showDictation && (
            <div className="voiceDictationPanel" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <div className="voiceDictationStatus">
                {dictation.listening ? (
                  <><i className="fa-solid fa-waveform-lines fa-fade"></i> Listening…</>
                ) : (
                  <><i className="fa-regular fa-pause"></i> Paused</>
                )}
              </div>
              <p className="voiceDictationText">
                {dictationText || <span className="voiceDictationPlaceholder">Say something…</span>}
              </p>
              {dictation.error && <p className="voiceDictationError">{dictation.error}</p>}
              <div className="voiceDictationActions">
                <button type="button" className="voiceDictationBtn" onClick={() => (dictation.listening ? dictation.stop() : dictation.start())}>
                  {dictation.listening ? "Pause" : "Resume"}
                </button>
                <button type="button" className="voiceDictationBtn" onClick={resetDictation}>Cancel</button>
                <button
                  type="button"
                  className="voiceDictationBtn voiceDictationBtnPrimary"
                  onClick={insertDictation}
                  disabled={!dictationText}
                >
                  Insert
                </button>
              </div>
            </div>
          )}
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
