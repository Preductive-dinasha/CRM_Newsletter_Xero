import { useState, useEffect } from "react";
import { getSessions, createSession, deleteSession } from "../api/sessions";
import { useAuth } from "../context/AuthContext";

function SessionItem({ session, active, onSelect, onDelete }) {
  const [hovering, setHovering] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirming) {
      onDelete(session.session_id);
      setConfirming(false);
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 2500);
    }
  };

  return (
    <div
      className="group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm"
      style={{
        background: active ? "rgba(255,255,255,0.12)" : hovering ? "rgba(255,255,255,0.06)" : "transparent",
        color: active ? "#fff" : "rgba(255,255,255,0.75)",
      }}
      onClick={() => onSelect(session.session_id)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setConfirming(false); }}
    >
      <span className="flex-1 truncate">{session.title || "New Chat"}</span>
      {(hovering || active) && (
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-0.5 rounded transition-all"
          style={{ color: confirming ? "#f87171" : "rgba(255,255,255,0.5)" }}
          title={confirming ? "Click again to delete" : "Delete"}
        >
          {confirming ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

export default function Sidebar({ activeSessionId, onSessionSelect, onNewSession, sessions, setSessions }) {
  const { user, logout } = useAuth();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getSessions()
      .then((res) => setSessions(res.data.sessions || []))
      .catch(() => {});
  }, [setSessions]);

  const handleNew = async () => {
    setCreating(true);
    try {
      const res = await createSession();
      const newSession = res.data;
      setSessions((prev) => [newSession, ...prev]);
      onNewSession(newSession.session_id);
    } catch {}
    setCreating(false);
  };

  const handleDelete = async (sessionId) => {
    try {
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
      if (activeSessionId === sessionId) {
        const remaining = sessions.filter((s) => s.session_id !== sessionId);
        if (remaining.length > 0) {
          onSessionSelect(remaining[0].session_id);
        } else {
          onSessionSelect(null);
        }
      }
    } catch {}
  };

  const initials = user
    ? `${user.f_name?.[0] || ""}${user.l_name?.[0] || ""}`.toUpperCase() || user.email[0].toUpperCase()
    : "?";

  const displayName = user ? `${user.f_name || ""} ${user.l_name || ""}`.trim() || user.email : "";

  return (
    <aside
      className="flex flex-col h-full w-64 flex-shrink-0"
      style={{ background: "#0A1929", borderRight: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="p-4 flex-shrink-0">
        <div className="flex items-center gap-2 mb-4 px-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#308AD8" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="font-bold text-white text-base tracking-tight">Preddi</span>
        </div>

        <button
          onClick={handleNew}
          disabled={creating}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{
            background: "rgba(48,138,216,0.15)",
            color: "#308AD8",
            border: "1px solid rgba(48,138,216,0.25)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {creating ? "Creating…" : "New Chat"}
        </button>
      </div>

      <div className="px-4 pb-2 flex-shrink-0">
        <p className="text-xs font-medium px-1 mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
          Recent
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 scrollbar-thin">
        {sessions.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: "rgba(255,255,255,0.3)" }}>
            No conversations yet
          </p>
        ) : (
          sessions.map((s) => (
            <SessionItem
              key={s.session_id}
              session={s}
              active={s.session_id === activeSessionId}
              onSelect={onSessionSelect}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <div
        className="p-4 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: "#308AD8" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-white">{displayName}</p>
            <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-lg transition-all"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; e.currentTarget.style.background = "transparent"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
