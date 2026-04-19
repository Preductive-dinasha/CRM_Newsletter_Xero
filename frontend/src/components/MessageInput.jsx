import { useState, useRef, useCallback, useEffect } from "react";
import SkillSelector from "./SkillSelector";
import useSpeech from "../hooks/useSpeech";

function AgentDropdown({ agent, onSelect, skills }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") { setOpen(false); return; }
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", handler);
    };
  }, []);

  const options = skills && skills.length > 0 ? skills : ["CRM", "Newsletter", "Xero"];

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all bg-orange-500 text-white hover:bg-orange-600"
        title="Select agent"
      >
        @{agent}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full mb-1.5 left-0 z-50 rounded-xl shadow-lg border border-[#e5e7eb] bg-white overflow-hidden min-w-36">
          <div className="py-1">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                  opt === agent ? "bg-[#308AD8]/10 text-[#308AD8] font-medium" : "text-[#0A222C] hover:bg-gray-50"
                }`}
                onClick={() => { onSelect(opt); setOpen(false); }}
              >
                <span className="text-xs opacity-50">@</span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FilePreview({ file, onRemove }) {
  const [thumb, setThumb] = useState(null);

  useEffect(() => {
    if (!file) { setThumb(null); return; }
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setThumb(url);
      return () => URL.revokeObjectURL(url);
    }
    setThumb(null);
  }, [file]);

  if (!file) return null;

  if (thumb) {
    return (
      <div className="relative inline-flex">
        <img src={thumb} alt="attachment preview" className="h-12 w-12 rounded-lg object-cover border-[1.5px] border-[#e5e7eb]" />
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs leading-none bg-gray-500 hover:bg-gray-700"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border border-[#e5e7eb]">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      {file.name}
      <button type="button" onClick={onRemove} className="hover:opacity-70">×</button>
    </span>
  );
}

function AttachIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function MicIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export default function MessageInput({ onSend, disabled, agent, onAgentChange, skills }) {
  const [text, setText] = useState("");
  const [atQuery, setAtQuery] = useState(null);
  const [file, setFile] = useState(null);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);

  const handleTranscript = useCallback((transcript) => {
    setText((prev) => (prev ? prev + " " + transcript : transcript));
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  const speech = useSpeech({ onTranscript: handleTranscript });

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    setText(val);
    const atIdx = val.lastIndexOf("@");
    if (atIdx !== -1) {
      const after = val.slice(atIdx + 1);
      if (!after.includes(" ")) { setAtQuery(after); return; }
    }
    setAtQuery(null);
  }, []);

  const handleSkillSelect = useCallback((selected) => {
    const atIdx = text.lastIndexOf("@");
    const cleaned = atIdx !== -1 ? text.slice(0, atIdx) : text;
    setText(cleaned);
    if (onAgentChange) onAgentChange(selected);
    setAtQuery(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [text, onAgentChange]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && !file) return;
    onSend({ message: trimmed, skill: agent === "General" ? null : agent, file });
    setText("");
    setFile(null);
    setAtQuery(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [text, agent, file, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && atQuery === null) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape" && atQuery !== null) setAtQuery(null);
  };

  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((i) => i.type.startsWith("image/"));
    if (imageItem) {
      const f = imageItem.getAsFile();
      if (f) { setFile(f); e.preventDefault(); }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const hasContent = text.trim() || file;

  return (
    <div className="px-4 sm:px-6 md:px-8 pb-8 sm:pb-10 pt-5 flex-shrink-0 bg-[#F0F2F5] border-t border-[#e5e7eb]">
      <div className="w-full max-w-3xl mx-auto relative">
        <div
          className="relative rounded-2xl shadow-md bg-white border border-gray-200/80"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {atQuery !== null && (
            <div className="absolute bottom-full left-0 w-full z-10">
              <SkillSelector query={atQuery} onSelect={handleSkillSelect} onClose={() => setAtQuery(null)} />
            </div>
          )}

          {file && (
            <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
              <FilePreview file={file} onRemove={() => setFile(null)} />
            </div>
          )}


          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Message Preddi… (@ to pick a skill)"
            disabled={disabled}
            rows={1}
            className="w-full resize-none bg-transparent px-4 py-4 text-sm outline-none disabled:opacity-50 text-[#0A222C] leading-relaxed overflow-auto max-h-[200px]"
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
            }}
          />

          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="p-2 rounded-lg transition-all text-gray-400 hover:text-[#308AD8] hover:bg-[#308AD8]/8"
                title="Attach file"
              >
                <AttachIcon />
              </button>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files[0] || null)}
                accept="image/*,.pdf,.txt,.csv,.docx,.xlsx"
              />

              <button
                type="button"
                onClick={speech.toggle}
                disabled={!speech.supported}
                className={`relative p-2 rounded-lg transition-all disabled:opacity-40 ${
                  speech.listening
                    ? "text-[#308AD8] bg-[#308AD8]/8"
                    : "text-gray-400 hover:text-[#308AD8] hover:bg-[#308AD8]/8"
                }`}
                title={!speech.supported ? "Voice input not supported" : speech.listening ? "Stop recording" : "Voice input"}
              >
                {speech.listening && (
                  <span className="absolute inset-0 rounded-lg animate-mic-pulse bg-[#308AD8]/15 pointer-events-none" />
                )}
                <span className="relative">
                  <MicIcon filled={speech.listening} />
                </span>
              </button>

              <span className="text-gray-200 text-xs">|</span>

              <AgentDropdown agent={agent || "General"} onSelect={onAgentChange || (() => {})} skills={skills} />
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={disabled || !hasContent}
              className={`p-2 rounded-xl transition-all disabled:opacity-40 ${
                hasContent && !disabled ? "bg-[#308AD8] text-white hover:bg-[#2677c4]" : "bg-gray-200 text-gray-400"
              }`}
            >
              <SendIcon />
            </button>
          </div>
        </div>
        <p className="text-center text-xs mt-4 text-gray-400/70">
          Enter to send · Shift+Enter for new line · @ to pick a skill
        </p>
      </div>

    </div>
  );
}
