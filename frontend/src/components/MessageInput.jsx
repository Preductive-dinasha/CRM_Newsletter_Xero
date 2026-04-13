import { useState, useRef, useCallback } from "react";
import SkillSelector, { SkillChip } from "./SkillSelector";

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState("");
  const [skill, setSkill] = useState(null);
  const [atQuery, setAtQuery] = useState(null);
  const [file, setFile] = useState(null);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    setText(val);

    const atIdx = val.lastIndexOf("@");
    if (atIdx !== -1) {
      const after = val.slice(atIdx + 1);
      if (!after.includes(" ")) {
        setAtQuery(after);
        return;
      }
    }
    setAtQuery(null);
  }, []);

  const handleSkillSelect = useCallback((selected) => {
    const atIdx = text.lastIndexOf("@");
    const cleaned = atIdx !== -1 ? text.slice(0, atIdx) : text;
    setText(cleaned);
    setSkill(selected);
    setAtQuery(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [text]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && !file) return;
    onSend({ message: trimmed, skill, file });
    setText("");
    setSkill(null);
    setFile(null);
    setAtQuery(null);
  }, [text, skill, file, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && atQuery === null) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((i) => i.type.startsWith("image/"));
    if (imageItem) {
      const f = imageItem.getAsFile();
      if (f) setFile(f);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  return (
    <div className="px-4 pb-6 pt-2 flex-shrink-0">
      <div className="max-w-3xl mx-auto">
        <div
          className="relative rounded-2xl shadow-sm"
          style={{ background: "white", border: "1.5px solid #e5e7eb" }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {atQuery !== null && (
            <div className="absolute bottom-full left-0 w-full">
              <SkillSelector
                query={atQuery}
                onSelect={handleSkillSelect}
                onClose={() => setAtQuery(null)}
              />
            </div>
          )}

          {(skill || file) && (
            <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
              {skill && (
                <SkillChip skill={skill} onRemove={() => setSkill(null)} />
              )}
              {file && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  {file.name}
                  <button onClick={() => setFile(null)} className="hover:opacity-70">×</button>
                </span>
              )}
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
            className="w-full resize-none bg-transparent px-4 py-4 text-sm outline-none disabled:opacity-50"
            style={{
              color: "#0A222C",
              lineHeight: "1.5",
              maxHeight: 200,
              overflow: "auto",
            }}
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
                className="p-2 rounded-lg transition-all text-sm"
                style={{ color: "#9ca3af" }}
                title="Attach file"
                onMouseEnter={(e) => { e.currentTarget.style.color = "#308AD8"; e.currentTarget.style.background = "rgba(48,138,216,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.background = "transparent"; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files[0] || null)}
                accept="image/*,.pdf,.txt,.csv,.docx,.xlsx"
              />
              <span className="text-xs" style={{ color: "#d1d5db" }}>|</span>
              <button
                type="button"
                onClick={() => {
                  const cur = text;
                  const atIdx = cur.lastIndexOf("@");
                  if (atIdx === -1 || cur.slice(atIdx + 1).includes(" ")) {
                    setText(cur + "@");
                    setAtQuery("");
                  }
                }}
                className="p-2 rounded-lg text-xs font-medium transition-all"
                style={{ color: "#9ca3af" }}
                title="Pick a skill"
                onMouseEnter={(e) => { e.currentTarget.style.color = "#308AD8"; e.currentTarget.style.background = "rgba(48,138,216,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.background = "transparent"; }}
              >
                @
              </button>
            </div>

            <button
              onClick={handleSend}
              disabled={disabled || (!text.trim() && !file)}
              className="p-2 rounded-xl transition-all disabled:opacity-40"
              style={{ background: "#308AD8", color: "white" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-center text-xs mt-2" style={{ color: "#d1d5db" }}>
          Shift+Enter for new line · @ to pick a skill
        </p>
      </div>
    </div>
  );
}
