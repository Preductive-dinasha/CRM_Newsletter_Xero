import { useState, useEffect } from "react";
import { getSessions, createSession, deleteSession } from "../api/sessions";
import { useAuth } from "../context/AuthContext";

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function SessionItem({ session, active, onSelect, onDelete }) {
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
      className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm ${
        active ? "bg-white/12 text-white" : "text-white/75 hover:bg-white/6"
      }`}
      onClick={() => onSelect(session.session_id)}
      onMouseLeave={() => setConfirming(false)}
    >
      <span className="flex-1 truncate">{session.title || "New Chat"}</span>
      <button
        onClick={handleDelete}
        className={`flex-shrink-0 p-0.5 rounded transition-all opacity-0 group-hover:opacity-100 ${
          confirming ? "text-red-400" : "text-white/50 hover:text-white"
        }`}
        title={confirming ? "Click again to delete" : "Delete"}
      >
        {confirming ? <CheckIcon /> : <TrashIcon />}
      </button>
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
        onSessionSelect(remaining.length > 0 ? remaining[0].session_id : null);
      }
    } catch {}
  };

  const initials = user
    ? `${user.f_name?.[0] || ""}${user.l_name?.[0] || ""}`.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"
    : "?";

  const displayName = user ? user.f_name || user.email : "";

  return (
    <aside className="flex flex-col h-full w-full bg-[#0A1929] border-r border-white/8">
      <div className="p-4 flex-shrink-0">
        <div className="flex items-center gap-2 mb-4 px-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#308AD8]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="font-bold text-white text-base tracking-tight">Preddi</span>
        </div>

        <button
          onClick={handleNew}
          disabled={creating}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-[#308AD8] bg-[#308AD8]/15 border border-[#308AD8]/25 hover:bg-[#308AD8]/25 disabled:opacity-60"
        >
          <PlusIcon />
          {creating ? "Creating…" : "New Chat"}
        </button>
      </div>

      <div className="px-4 pb-2 flex-shrink-0">
        <p className="text-xs font-medium px-1 mb-1 text-white/30">Recent</p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 scrollbar-thin">
        {sessions.length === 0 ? (
          <p className="text-xs text-center py-4 text-white/30">No conversations yet</p>
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

      <div className="p-4 flex-shrink-0 border-t border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-[#1e3a5f]">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-white">{displayName}</p>
            <p className="text-xs truncate text-white/40">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-lg transition-all text-white/40 hover:text-white hover:bg-white/8"
          >
            <SignOutIcon />
          </button>
        </div>
      </div>
    </aside>
  );
}
