import { useState, useEffect } from "react";
import { Trash2, Check, Plus, LogOut, MessageSquare } from "lucide-react";
import { getSessions, createSession, deleteSession } from "../api/sessions";
import { useAuth } from "../context/AuthContext";

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
      className={`group relative flex items-center gap-2 px-3.5 py-2.5 mb-1 rounded-md border-l-2 cursor-pointer transition-all duration-150 text-sm ${
        active
          ? "bg-[#dde1ff] text-[#0d2678] font-semibold border-[#0d2678]"
          : "text-[#454651] border-transparent hover:bg-[#f0e6e0] hover:text-[#1f1b17]"
      }`}
      onClick={() => onSelect(session.session_id)}
      onMouseLeave={() => setConfirming(false)}
    >
      <span className="flex-1 truncate">{session.title || "New Chat"}</span>
      <button
        onClick={handleDelete}
        className={`flex-shrink-0 p-1 rounded-md transition duration-150 ease-out opacity-0 group-hover:opacity-100 ${
          confirming ? "text-[#0d2678]" : "text-[#757683] hover:text-[#1f1b17]"
        }`}
        title={confirming ? "Click again to delete" : "Delete"}
      >
        {confirming ? <Check size={14} /> : <Trash2 size={14} />}
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
      <div className="px-5 pt-6 pb-5 flex-shrink-0">
        <div className="flex items-center gap-3 mb-6 px-0.5">
          <div className="w-9 h-9 rounded-lg bg-[#0d2678] flex items-center justify-center flex-shrink-0 text-white shadow-sm">
            <MessageSquare size={18} strokeWidth={2.4} />
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
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-semibold transition-all duration-150 text-white bg-[#0d2678] hover:bg-[#0d2678]/90 active:scale-[0.99] disabled:opacity-60 shadow-sm"
        >
          <Plus size={16} strokeWidth={2.5} />
          {creating ? "Creating…" : "New Conversation"}
        </button>
      </div>

      <div className="px-6 pb-2 flex-shrink-0">
        <p className="text-[10px] font-bold px-0.5 mb-1 uppercase tracking-[0.18em] text-[#757683]">Recent</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3.5 pb-4 scrollbar-thin">
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

      <div className="px-5 py-4 flex-shrink-0 border-t border-[#eae1db] bg-[#fcf2ec]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 bg-[#0d2678] shadow-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold truncate text-[#1f1b17]">{displayName}</p>
            <p className="text-[11px] truncate text-[#757683]">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-2 rounded-md transition duration-150 ease-out text-[#757683] hover:bg-[#f0e6e0] hover:text-[#0d2678]"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
