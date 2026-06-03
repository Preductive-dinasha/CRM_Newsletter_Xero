import { useState, useRef, useCallback, useEffect } from "react";
import { Paperclip, Mic, Send, ChevronDown, FileText, X } from "lucide-react";
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
        <ChevronDown size={12} strokeWidth={2.5} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-1.5 left-0 z-50 rounded-lg shadow-lg border border-[#eae1db] bg-white overflow-hidden min-w-36">
          <div className="px-3.5 py-2 border-b border-[#eae1db] bg-[#fcf2ec]">
            <p className="text-xs font-semibold text-[#454651] uppercase tracking-wider">Skills</p>
          </div>
          <div className="py-1.5">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`w-full flex items-center gap-2 px-3.5 py-2 text-[13px] text-left transition duration-150 ease-out ${
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
        <img
          src={thumb}
          alt="attachment preview"
          className="h-12 w-12 rounded-md object-cover border-[1.5px] border-[#eae1db]"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-sm flex items-center justify-center text-white bg-[#757683] hover:bg-[#0d2678]"
        >
          <X size={10} strokeWidth={3} />
        </button>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[#dde1ff] text-[#0d2678] border border-[#b8c3ff]">
      <FileText size={12} />
      {file.name}
      <button
        type="button"
        onClick={onRemove}
        className="hover:opacity-70 transition-opacity leading-none ml-0.5"
      >
        <X size={11} strokeWidth={2.5} />
      </button>
    </span>
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
    <div className="px-4 sm:px-6 md:px-10 pb-6 pt-3.5 flex-shrink-0 bg-[#fff8f5] border-t border-[#eae1db]">
      <div className="w-full relative">
        <div
          className="relative group"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {/* Glow on focus */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0d2678] to-[#0061a2] rounded-[22px] opacity-0 group-focus-within:opacity-10 blur transition duration-300 pointer-events-none" />

          <div className="relative rounded-[22px] bg-white border border-[#eae1db] shadow-sm ring-1 ring-black/[0.03]">

            {/* @ skill selector popup */}
            {atQuery !== null && (
              <div className="absolute bottom-full left-0 w-full z-10">
                <SkillSelector
                  query={atQuery}
                  onSelect={handleSkillSelect}
                  onClose={() => setAtQuery(null)}
                  skills={skills}
                />
              </div>
            )}

            {/* File preview strip */}
            {file && (
              <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-[#fcf2ec] border-b border-[#eae1db] rounded-t-[22px]">
                <FilePreview file={file} onRemove={() => setFile(null)} />
              </div>
            )}

            {/* Context header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#fcf2ec] border-b border-[#eae1db]/60 rounded-t-[22px]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[#f0e6e0] px-2 py-0.5 rounded-md border border-[#eae1db] cursor-pointer hover:bg-[#eae1db] transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0061a2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/>
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                  </svg>
                  <span className="text-[11px] font-bold text-[#454651] uppercase tracking-wide">Global CRM</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#757683" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
                <div className="w-1 h-1 rounded-full bg-[#c5c5d3]" />
                <span className="text-[11px] font-bold text-[#757683]">v2.4 Cognitive Model</span>
              </div>
              <span className="text-[10px] font-bold text-[#757683] uppercase tracking-widest">AI Processing Ready</span>
            </div>

            {/* Textarea */}
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
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
              }}
            />

            {/* Toolbar footer */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-[#fcf2ec] border-t border-[#eae1db] rounded-b-[22px]">
              <div className="flex items-center gap-1">
                {/* Attach */}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="p-2 rounded-md transition duration-150 ease-out text-[#757683] hover:text-[#0d2678] hover:bg-[#f0e6e0]"
                  title="Attach file"
                >
                  <Paperclip size={16} />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                  accept="image/*,.pdf,.txt,.csv,.docx,.xlsx"
                />

                {/* Mic */}
                <button
                  type="button"
                  onClick={speech.toggle}
                  disabled={!speech.supported}
                  className={`relative p-2 rounded-md transition duration-150 ease-out disabled:opacity-40 ${
                    speech.listening
                      ? "text-[#0d2678] bg-[#dde1ff]"
                      : "text-[#757683] hover:text-[#0d2678] hover:bg-[#f0e6e0]"
                  }`}
                  title={
                    !speech.supported
                      ? "Voice input not supported"
                      : speech.listening
                      ? "Stop recording"
                      : "Voice input"
                  }
                >
                  {speech.listening && (
                    <span className="absolute inset-0 rounded-md animate-mic-pulse bg-[#0d2678]/10 pointer-events-none" />
                  )}
                  <span className="relative">
                    <Mic size={16} fill={speech.listening ? "currentColor" : "none"} />
                  </span>
                </button>

                <span className="text-[#c5c5d3] text-xs mx-0.5">|</span>

                {/* Agent selector */}
                <AgentDropdown
                  agent={agent || "General"}
                  onSelect={onAgentChange || (() => {})}
                  skills={skills}
                />
              </div>

              {/* Send button */}
              <button
                type="button"
                onClick={handleSend}
                disabled={disabled || !hasContent}
                className={`h-10 w-10 rounded-xl transition-all duration-150 ease-out disabled:opacity-30 flex items-center justify-center ${
                  hasContent && !disabled
                    ? "bg-[#0d2678] text-white hover:bg-[#0d2678]/90 hover:scale-105 active:scale-95 shadow-sm"
                    : "bg-[#eae1db] text-[#757683]"
                }`}
              >
                <Send size={16} strokeWidth={2.4} />
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
