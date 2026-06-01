import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import { getHistory, getSkills } from "../api/sessions";
import { sendMessage } from "../api/chat";
import { createSession } from "../api/sessions";

const AGENT_LS_KEY = "preddi_last_agent";
const MOBILE_BREAKPOINT = 768;

const AGENT_COLORS = {
  CRM: { dot: "bg-[#5cadfe] animate-pulse", badge: "bg-[#0d2678] text-white border border-[#2a3e8f]" },
  Newsletter: { dot: "bg-[#5cadfe] animate-pulse", badge: "bg-[#0d2678] text-white border border-[#2a3e8f]" },
  Xero: { dot: "bg-[#5cadfe] animate-pulse", badge: "bg-[#0d2678] text-white border border-[#2a3e8f]" },
};

function AgentBadge({ agent }) {
  if (!agent) return null;
  const c = AGENT_COLORS[agent] || { dot: "bg-[#5cadfe] animate-pulse", badge: "bg-[#0d2678] text-white border border-[#2a3e8f]" };
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide ${c.badge}`}>
      <span className={`${c.dot} w-2 h-2 rounded-full flex-shrink-0`} />
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

function isMobileViewport() {
  return typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;
}

export default function ChatPage() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("New Chat");
  const [isMobile, setIsMobile] = useState(isMobileViewport());
  const [sidebarOpen, setSidebarOpen] = useState(!isMobileViewport());
  const [skills, setSkills] = useState([]);

  const defaultAgent = "CRM";
  const ALLOWED_AGENTS = ["CRM", "Newsletter", "Xero"];
  const savedAgent = typeof window !== "undefined"
    ? (localStorage.getItem(AGENT_LS_KEY) || defaultAgent)
    : defaultAgent;
  const validatedAgent = ALLOWED_AGENTS.includes(savedAgent) ? savedAgent : defaultAgent;
  const [agent, setAgent] = useState(validatedAgent);

  useEffect(() => {
    const handleResize = () => {
      const mobile = isMobileViewport();
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    if (isMobileViewport()) setSidebarOpen(false);
  }, []);

  const handleNewSession = useCallback((sessionId) => {
    setActiveSessionId(sessionId);
    setMessages([]);
    if (isMobileViewport()) setSidebarOpen(false);
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

      if (data.file_url) {
        setMessages((prev) =>
          prev.map((m) =>
            m === userMsg ? { ...m, file_url: data.file_url } : m
          )
        );
      }

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
    }
  }, [activeSessionId, agent]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#fff8f5]">

      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`
          flex-shrink-0 transition-all duration-300
          ${isMobile
            ? `fixed inset-y-0 left-0 z-50 w-[300px] ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`
            : sidebarOpen ? "w-[280px]" : "w-0 overflow-hidden"
          }
        `}
      >
        <Sidebar
          activeSessionId={activeSessionId}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
          sessions={sessions}
          setSessions={setSessions}
        />
      </div>

      <div className="chat-container flex flex-col min-w-0">
        <header className="flex-shrink-0 flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3.5 bg-[#fff8f5]/80 backdrop-blur-md border-b border-[#eae1db] shadow-sm">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-xl transition-all text-[#757683] hover:bg-[#f0e6e0] hover:text-[#0d2678] flex-shrink-0"
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            <HamburgerIcon />
          </button>

          <h1 className="font-semibold text-sm sm:text-base truncate flex-1 text-[#1f1b17]" style={{ fontFamily: "'Outfit', sans-serif" }}>
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
