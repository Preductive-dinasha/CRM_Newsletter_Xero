import { useState, useRef, useCallback } from "react";

const supported =
  typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

export default function useSpeech({ onTranscript, lang = "en-US" } = {}) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const start = useCallback(() => {
    if (!supported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ");
      if (onTranscript) onTranscript(transcript);
    };

    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [lang, onTranscript]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { listening, supported, start, stop, toggle };
}
