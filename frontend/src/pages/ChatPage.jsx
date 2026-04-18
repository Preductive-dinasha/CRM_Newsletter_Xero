import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import { getHistory, getSkills } from "../api/sessions";
import { sendMessage } from "../api/chat";
import { createSession } from "../api/sessions";

const AGENT_LS_KEY = "preddi_last_agent";

const AGENT_COLORS = {
  CRM: { dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-600 border border-amber-500/25" },
  Newsletter: { dot: "bg-blue-500", badge: "bg-blue-500/10 text-blue-600 border border-blue-500/25" },
  Xero: { dot: "bg-green-500", badge: "bg-green-500/10 text-green-600 border border-green-500/25" },
};

function AgentBadge({ agent }) {
  if (!agent) return null;
  const c = AGENT_COLORS[agent] || { dot: "bg-[#308AD8]", badge: "bg-[#308AD8]/10 text-[#308AD8] border border-[#308AD8]/25" };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${c.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      @{agent}
    </span>
  );
}

function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export default function ChatPage() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("New Chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [skills, setSkills] = useState([]);

  const defaultAgent = "CRM";
  const savedAgent = typeof window !== "undefined"
    ? (localStorage.getItem(AGENT_LS_KEY) || defaultAgent)
    : defaultAgent;
  const [agent, setAgent] = useState(savedAgent);

  const handleAgentChange = useCallback((a) => {
    setAgent(a);
    localStorage.setItem(AGENT_LS_KEY, a);
  }, []);

  useEffect(() => {
    getSkills()
      .then((res) => setSkills(res.data.skills || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      setSessionTitle("New Chat");
      return;
    }
    getHistory(activeSessionId)
      .then((res) => setMessages(res.data.history || []))
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

    const effectiveSkill = skill || agent;
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

    let filePreview = null;
    let fileName = null;
    if (file) {
      fileName = file.name;
      if (file.type.startsWith("image/")) {
        filePreview = URL.createObjectURL(file);
      }
    }

    const userMsg = {
      role: "user",
      content: message,
      skill: effectiveSkill || null,
      file_preview: filePreview,
      file_name: fileName,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await sendMessage(currentSessionId, message, effectiveSkill, file);
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
        isError: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
      if (filePreview) URL.revokeObjectURL(filePreview);
    }
  }, [activeSessionId, agent]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9F9F9]">
      <div className={`flex-shrink-0 transition-all duration-300 ${sidebarOpen ? "w-64" : "w-0 overflow-hidden"}`}>
        {sidebarOpen && (
          <Sidebar
            activeSessionId={activeSessionId}
            onSessionSelect={handleSessionSelect}
            onNewSession={handleNewSession}
            sessions={sessions}
            setSessions={setSessions}
          />
        )}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-lg transition-all text-gray-400 hover:bg-gray-100 hover:text-[#0A222C] flex-shrink-0"
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            <HamburgerIcon />
          </button>

          <h1 className="font-semibold text-base truncate flex-1 text-[#0A222C]">
            {sessionTitle}
          </h1>

          <AgentBadge agent={agent} />
        </header>

        <MessageList messages={messages} isTyping={isTyping} />
        <MessageInput
          onSend={handleSend}
          disabled={isTyping}
          agent={agent}
          onAgentChange={handleAgentChange}
          skills={skills}
        />
      </div>
    </div>
  );
}
