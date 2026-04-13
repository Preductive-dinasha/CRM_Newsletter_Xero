import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import { getHistory } from "../api/sessions";
import { sendMessage } from "../api/chat";
import { createSession } from "../api/sessions";

export default function ChatPage() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("New Chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      setSessionTitle("New Chat");
      return;
    }
    getHistory(activeSessionId)
      .then((res) => {
        setMessages(res.data.history || []);
      })
      .catch(() => setMessages([]));
  }, [activeSessionId]);

  useEffect(() => {
    if (!activeSessionId) return;
    const session = sessions.find((s) => s.session_id === activeSessionId);
    if (session?.title) setSessionTitle(session.title);
  }, [activeSessionId, sessions]);

  const handleSessionSelect = useCallback((sessionId) => {
    setActiveSessionId(sessionId);
  }, []);

  const handleNewSession = useCallback((sessionId) => {
    setActiveSessionId(sessionId);
    setMessages([]);
  }, []);

  const handleSend = useCallback(async ({ message, skill, file }) => {
    if (!message.trim() && !file) return;

    let currentSessionId = activeSessionId;

    if (!currentSessionId) {
      try {
        const res = await createSession();
        const newSession = res.data;
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.session_id);
        currentSessionId = newSession.session_id;
      } catch {
        return;
      }
    }

    const userMsg = {
      role: "user",
      content: message,
      skill: skill || null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await sendMessage(currentSessionId, message, skill, file);
      const data = res.data;
      const assistantMsg = {
        role: "assistant",
        content: data.reply || data.message || "I'm sorry, I couldn't process that.",
        media_url: data.media_url || null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (data.title) {
        setSessionTitle(data.title);
        setSessions((prev) =>
          prev.map((s) =>
            s.session_id === currentSessionId ? { ...s, title: data.title } : s
          )
        );
      }
    } catch (err) {
      const errMsg = {
        role: "assistant",
        content: err.response?.data?.error || "Something went wrong. Please try again.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [activeSessionId]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F9F9F9" }}>
      {sidebarOpen && (
        <Sidebar
          activeSessionId={activeSessionId}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
          sessions={sessions}
          setSessions={setSessions}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b"
          style={{ background: "white", borderColor: "#e5e7eb" }}
        >
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-lg transition-all"
            style={{ color: "#9ca3af" }}
            title="Toggle sidebar"
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.color = "#0A222C"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9ca3af"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="font-semibold text-base truncate" style={{ color: "#0A222C" }}>
            {sessionTitle}
          </h1>
        </header>

        <MessageList messages={messages} isTyping={isTyping} />
        <MessageInput onSend={handleSend} disabled={isTyping} />
      </div>
    </div>
  );
}
