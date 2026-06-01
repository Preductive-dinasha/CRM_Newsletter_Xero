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
        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold transition duration-150 ease-out bg-[#dde1ff] text-[#0d2678] border border-[#b8c3ff] hover:bg-[#b8c3ff]/40"
        title="Select agent"
      >
        @{agent}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full mb-1.5 left-0 z-50 rounded-xl shadow-lg border border-[#eae1db] bg-white overflow-hidden min-w-36">
          <div className="py-1">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left transition duration-150 ease-out ${
                  opt === agent
                    ? "bg-[#dde1ff] text-[#0d2678] font-semibold"
                    : "text-[#1f1b17] hover:bg-[#f6ece6]"
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
        <img src={thumb} alt="attachment preview" className="h-12 w-12 rounded-lg object-cover border-[1.5px] border-[#eae1db]" />
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs leading-none bg-[#757683] hover:bg-[#0d2678]"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[#dde1ff] text-[#0d2678] border border-[#b8c3ff]">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      {file.name}
      <button type="button" onClick={onRemove} className="hover:opacity-70 transition-opacity leading-none ml-0.5">
        ×
      </button>
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
    <div className="px-4 sm:px-6 md:px-8 pb-5 sm:pb-6 pt-3 flex-shrink-0 bg-[#fff8f5] border-t border-[#eae1db]">
      <div className="w-full relative">
        <div
          className="relative group"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0d2678] to-[#0061a2] rounded-2xl opacity-0 group-focus-within:opacity-10 blur transition duration-300 pointer-events-none" />
          <div className="relative rounded-[18px] bg-white border border-[#eae1db] shadow-sm ring-1 ring-black/[0.03]">
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
              placeholder="Message Pai… (@ to pick a skill)"
              disabled={disabled}
              rows={1}
              className="w-full resize-none bg-transparent px-4 py-4 text-[14px] outline-none disabled:opacity-50 text-[#1f1b17] leading-relaxed overflow-auto max-h-[200px] placeholder:text-[#757683]"
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
                  className="p-2 rounded-lg transition duration-150 ease-out text-[#757683] hover:text-[#0d2678] hover:bg-[#f0e6e0]"
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
                  className={`relative p-2 rounded-lg transition duration-150 ease-out disabled:opacity-40 ${
                    speech.listening
                      ? "text-[#0d2678] bg-[#dde1ff]"
                      : "text-[#757683] hover:text-[#0d2678] hover:bg-[#f0e6e0]"
                  }`}
                  title={!speech.supported ? "Voice input not supported" : speech.listening ? "Stop recording" : "Voice input"}
                >
                  {speech.listening && (
                    <span className="absolute inset-0 rounded-lg animate-mic-pulse bg-[#0d2678]/10 pointer-events-none" />
                  )}
                  <span className="relative">
                    <MicIcon filled={speech.listening} />
                  </span>
                </button>

                <span className="text-[#c5c5d3] text-xs mx-0.5">|</span>

                <AgentDropdown agent={agent || "General"} onSelect={onAgentChange || (() => {})} skills={skills} />
              </div>

              <button
                type="button"
                onClick={handleSend}
                disabled={disabled || !hasContent}
                className={`h-8 w-8 rounded-full transition duration-150 ease-out disabled:opacity-30 flex items-center justify-center ${
                  hasContent && !disabled
                    ? "bg-[#0d2678] text-white hover:bg-[#0d2678]/90 active:scale-[0.96] shadow-sm"
                    : "bg-[#eae1db] text-[#757683]"
                }`}
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
        <p className="text-center text-xs mt-3 text-[#757683]">
          Enter to send · Shift+Enter for new line · @ to pick a skill
        </p>
      </div>
    </div>
  );
}
