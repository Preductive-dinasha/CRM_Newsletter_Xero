import { useState, useEffect, useRef } from "react";

const SKILL_COLORS = {
  CRM: "bg-[#dde1ff] text-[#0d2678] border border-[#b8c3ff]",
  Newsletter: "bg-[#dde1ff] text-[#0d2678] border border-[#b8c3ff]",
  Xero: "bg-[#dde1ff] text-[#0d2678] border border-[#b8c3ff]",
};

function getSkillCls(skill) {
  return SKILL_COLORS[skill] || "bg-[#dde1ff] text-[#0d2678] border border-[#b8c3ff]";
}

export function SkillChip({ skill, onRemove }) {
  const cls = getSkillCls(skill);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      @{skill}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity leading-none"
          aria-label="Remove skill"
        >
          ×
        </button>
      )}
    </span>
  );
}

export function SkillBadge({ skill }) {
  const cls = getSkillCls(skill);
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[12px] font-semibold ${cls}`}>
      @{skill}
    </span>
  );
}

const DEFAULT_SKILLS = ["CRM", "Newsletter", "Xero"];

export default function SkillSelector({ query, onSelect, onClose, skills }) {
  const [highlighted, setHighlighted] = useState(0);
  const ref = useRef(null);
  const allSkills = skills || DEFAULT_SKILLS;

  const filtered = query
    ? allSkills.filter((s) => s.toLowerCase().startsWith((query || "").toLowerCase()))
    : allSkills;

  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") { onClose?.(); return; }
      if (e.key === "ArrowDown") { setHighlighted((h) => Math.min(h + 1, filtered.length - 1)); return; }
      if (e.key === "ArrowUp") { setHighlighted((h) => Math.max(h - 1, 0)); return; }
      if (e.key === "Enter" && filtered[highlighted]) {
        e.preventDefault();
        onSelect(filtered[highlighted]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered, highlighted, onSelect, onClose]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  if (!filtered.length) return null;

  return (
    <div
      ref={ref}
      className="rounded-xl shadow-lg border border-[#eae1db] bg-white overflow-hidden min-w-40"
    >
      <div className="px-3 py-2 border-b border-[#eae1db] bg-[#fcf2ec]">
        <p className="text-xs font-semibold text-[#454651] uppercase tracking-wider">Skills</p>
      </div>
      <div className="py-1">
        {filtered.map((skill, i) => {
          const isHi = i === highlighted;
          return (
            <button
              key={skill}
              type="button"
              className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left transition duration-150 ease-out ${
                isHi ? "bg-[#dde1ff] text-[#0d2678] font-semibold" : "text-[#1f1b17] hover:bg-[#f6ece6]"
              }`}
              onMouseEnter={() => setHighlighted(i)}
              onClick={() => onSelect(skill)}
            >
              <span className={`text-xs font-semibold ${isHi ? "opacity-70" : "opacity-40"}`}>@</span>
              {skill}
            </button>
          );
        })}
      </div>
    </div>
  );
}
