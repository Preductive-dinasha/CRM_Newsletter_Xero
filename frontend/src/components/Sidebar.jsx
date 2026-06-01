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

function ChatBubbleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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
      className={`group relative flex items-center gap-2 px-3 py-2.5 mb-1 rounded-xl border cursor-pointer transition-all duration-150 text-sm ${
        active
          ? "bg-[#dde1ff] text-[#0d2678] font-semibold border-[#b8c3ff]"
          : "text-[#454651] border-transparent hover:bg-[#f0e6e0] hover:text-[#1f1b17]"
      }`}
      onClick={() => onSelect(session.session_id)}
      onMouseLeave={() => setConfirming(false)}
    >
      <span className="flex-1 truncate">{session.title || "New Chat"}</span>
      <button
        onClick={handleDelete}
        className={`flex-shrink-0 p-1 rounded-lg transition duration-150 ease-out opacity-0 group-hover:opacity-100 ${
          confirming ? "text-[#0d2678]" : "text-[#757683] hover:text-[#1f1b17]"
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
    ? (user.f_name?.[0] || user.email?.[0] || "?").toUpperCase()
    : "?";

  const displayName = user ? user.f_name || user.email : "";

  return (
    <aside className="flex flex-col h-full w-full bg-[#fcf2ec] border-r border-[#eae1db]">
      <div className="px-4 pt-5 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-5 px-1">
          <div className="w-9 h-9 rounded-xl bg-[#0d2678] flex items-center justify-center flex-shrink-0 text-white shadow-sm">
            <ChatBubbleIcon />
          </div>
          <div>
            <span className="font-bold text-[#0d2678] text-lg leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Pai
            </span>
            <p className="text-[10px] text-[#757683] uppercase tracking-widest font-semibold leading-tight">
              Cognitive CRM
            </p>
          </div>
        </div>

        <button
          onClick={handleNew}
          disabled={creating}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-white bg-[#0d2678] hover:bg-[#0d2678]/90 active:scale-[0.98] disabled:opacity-60 shadow-sm"
        >
          <PlusIcon />
          {creating ? "Creating…" : "New Chat"}
        </button>
      </div>

      <div className="px-5 pb-1.5 flex-shrink-0">
        <p className="text-[10px] font-bold px-1 mb-1 uppercase tracking-[0.18em] text-[#757683]">Recent</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
        {sessions.length === 0 ? (
          <p className="text-xs text-center py-6 text-[#757683]">No conversations yet</p>
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

      <div className="px-4 py-4 flex-shrink-0 border-t border-[#eae1db] bg-[#fcf2ec]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 bg-[#0d2678] shadow-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold truncate text-[#1f1b17]">{displayName}</p>
            <p className="text-[11px] truncate text-[#757683]">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-2 rounded-lg transition duration-150 ease-out text-[#757683] hover:bg-[#f0e6e0] hover:text-[#0d2678]"
          >
            <SignOutIcon />
          </button>
        </div>
      </div>
    </aside>
  );
}
