import { useState, useEffect, useRef } from "react";

const SKILL_COLORS = {
  CRM: "bg-amber-500/10 text-amber-700 border border-amber-500/25",
  Newsletter: "bg-blue-500/10 text-blue-700 border border-blue-500/25",
  Xero: "bg-green-500/10 text-green-700 border border-green-500/25",
};

function getSkillCls(skill) {
  return SKILL_COLORS[skill] || "bg-gray-100 text-gray-700 border border-gray-200";
}

export function SkillChip({ skill, onRemove }) {
  const cls = getSkillCls(skill);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
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
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${cls}`}>
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
      className="rounded-xl shadow-lg border border-[#e5e7eb] bg-white overflow-hidden min-w-40"
    >
      <div className="px-3 py-2 border-b border-[#e5e7eb]">
        <p className="text-xs font-medium text-gray-400">Skills</p>
      </div>
      <div className="py-1">
        {filtered.map((skill, i) => {
          const isHi = i === highlighted;
          return (
            <button
              key={skill}
              type="button"
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                isHi ? "bg-[#308AD8]/8 text-[#308AD8]" : "text-[#0A222C] hover:bg-gray-50"
              }`}
              onMouseEnter={() => setHighlighted(i)}
              onClick={() => onSelect(skill)}
            >
              <span className="text-xs font-medium opacity-50">@</span>
              {skill}
            </button>
          );
        })}
      </div>
    </div>
  );
}
