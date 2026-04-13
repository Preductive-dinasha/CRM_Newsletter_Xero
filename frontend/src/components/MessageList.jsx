import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SkillBadge } from "./SkillSelector";

function Message({ msg }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "#308AD8" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
      )}

      <div className={`max-w-[75%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        {msg.skill && <SkillBadge skill={msg.skill} />}
        <div
          className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
          style={
            isUser
              ? { background: "#308AD8", color: "white", borderBottomRightRadius: 4 }
              : { background: "white", color: "#0A222C", border: "1px solid #e5e7eb", borderBottomLeftRadius: 4 }
          }
        >
          {isUser ? (
            <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.content}</p>
          ) : (
            <div className="prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            </div>
          )}
          {msg.media_url && (
            <img
              src={msg.media_url}
              alt="Agent response"
              className="mt-2 rounded-lg max-w-full"
              style={{ maxHeight: 400 }}
            />
          )}
        </div>
        <span className="text-xs" style={{ color: "#9ca3af" }}>
          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
        </span>
      </div>

      {isUser && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white"
          style={{ background: "#0A222C" }}
        >
          U
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "#308AD8" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div
        className="px-4 py-3 rounded-2xl flex items-center gap-1"
        style={{ background: "white", border: "1px solid #e5e7eb", borderBottomLeftRadius: 4 }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background: "#308AD8",
              animation: `bounce 1.2s ${i * 0.2}s infinite`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function MessageList({ messages, isTyping }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(48,138,216,0.1)" }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#308AD8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg" style={{ color: "#0A222C" }}>
              How can I help you?
            </h3>
            <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>
              Type a message, or use @ to select a skill
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <Message key={msg.id || i} msg={msg} />
        ))}

        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
