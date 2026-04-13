import { useState, useEffect, useRef } from "react";
import { getSkills } from "../api/sessions";

const SKILL_COLORS = {
  CRM: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
  Newsletter: { bg: "#dbeafe", text: "#1e40af", border: "#bfdbfe" },
  Xero: { bg: "#d1fae5", text: "#065f46", border: "#a7f3d0" },
};

function getSkillStyle(skill) {
  return SKILL_COLORS[skill] || { bg: "#f3f4f6", text: "#374151", border: "#e5e7eb" };
}

export function SkillChip({ skill, onRemove }) {
  const style = getSkillStyle(skill);
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
    >
      {skill}
      <button
        onClick={onRemove}
        className="hover:opacity-70 transition-opacity leading-none"
        aria-label="Remove skill"
      >
        ×
      </button>
    </span>
  );
}

export function SkillBadge({ skill }) {
  const style = getSkillStyle(skill);
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
      style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
    >
      @{skill}
    </span>
  );
}

export default function SkillSelector({ query, onSelect, onClose }) {
  const [skills, setSkills] = useState([]);
  const [highlighted, setHighlighted] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    getSkills()
      .then((res) => {
        const all = res.data.skills || [];
        const filtered = query
          ? all.filter((s) => s.toLowerCase().startsWith(query.toLowerCase()))
          : all;
        setSkills(filtered);
        setHighlighted(0);
      })
      .catch(() => {});
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") setHighlighted((h) => Math.min(h + 1, skills.length - 1));
      if (e.key === "ArrowUp") setHighlighted((h) => Math.max(h - 1, 0));
      if (e.key === "Enter" && skills[highlighted]) {
        e.preventDefault();
        onSelect(skills[highlighted]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [skills, highlighted, onSelect, onClose]);

  if (!skills.length) return null;

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 left-0 z-50 rounded-xl shadow-lg border overflow-hidden"
      style={{ background: "white", borderColor: "#e5e7eb", minWidth: 160 }}
    >
      <div className="py-1">
        {skills.map((skill, i) => (
          <button
            key={skill}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
            style={{
              background: i === highlighted ? "#f0f9ff" : "transparent",
              color: i === highlighted ? "#308AD8" : "#0A222C",
            }}
            onMouseEnter={() => setHighlighted(i)}
            onClick={() => onSelect(skill)}
          >
            <span className="text-xs font-medium opacity-50">@</span>
            {skill}
          </button>
        ))}
      </div>
    </div>
  );
}
