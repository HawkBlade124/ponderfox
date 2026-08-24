import { useCallback, useEffect, useRef, useState } from "react";

const SpeechRecognitionImpl =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

// Drives one browser SpeechRecognition session at a time and accumulates the
// finalized transcript across pause/resume, so a caller can let someone
// dictate in bursts before deciding to send or discard the result.
export function useSpeechDictation() {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognitionImpl) {
      setError("Voice dictation isn't supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";

    recognition.onresult = (event) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalChunk += `${chunk} `;
        else interimChunk += chunk;
      }
      if (finalChunk) {
        setTranscript((prev) => (prev ? `${prev} ${finalChunk}` : finalChunk).trim());
      }
      setInterim(interimChunk);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(event.error === "not-allowed" ? "Microphone access was denied." : "Voice dictation failed.");
    };

    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = recognition;
    setError("");
    setListening(true);
    recognition.start();
  }, []);

  const reset = useCallback(() => {
    recognitionRef.current?.stop();
    setTranscript("");
    setInterim("");
    setError("");
  }, []);

  return {
    supported: !!SpeechRecognitionImpl,
    listening,
    transcript,
    interim,
    error,
    start,
    stop,
    reset,
  };
}
