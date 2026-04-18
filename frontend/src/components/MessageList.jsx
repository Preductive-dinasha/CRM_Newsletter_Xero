import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SkillBadge } from "./SkillSelector";

function PreddiAvatar() {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-[#308AD8]">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white bg-[#0A222C]">
      U
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  const isError = msg.isError;

  useEffect(() => {
    return () => {
      if (msg.file_preview && msg.file_preview.startsWith("blob:")) {
        URL.revokeObjectURL(msg.file_preview);
      }
    };
  }, [msg.file_preview]);

  const bubbleCls = isUser
    ? "px-4 py-3 rounded-2xl text-sm leading-relaxed bg-[#308AD8] text-white rounded-br-[4px]"
    : isError
    ? "px-4 py-3 rounded-2xl text-sm leading-relaxed bg-red-50 text-red-600 border border-red-200 rounded-bl-[4px]"
    : "px-4 py-3 rounded-2xl text-sm leading-relaxed bg-white text-[#0A222C] border border-[#e5e7eb] rounded-bl-[4px]";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <PreddiAvatar />}

      <div className={`max-w-[88%] sm:max-w-[78%] md:max-w-[72%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        {msg.skill && <SkillBadge skill={msg.skill} />}
        <div className={bubbleCls}>
          {isUser ? (
            <>
              {msg.content && (
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              )}
              {msg.file_preview && (
                <img
                  src={msg.file_preview}
                  alt="attachment"
                  className="mt-2 rounded-lg max-w-full max-h-60"
                />
              )}
              {msg.file_name && !msg.file_preview && (
                <a
                  href={msg.file_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/20 border border-white/30 hover:bg-white/30 transition-colors no-underline"
                  onClick={!msg.file_url ? (e) => e.preventDefault() : undefined}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 opacity-80">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="text-xs truncate opacity-90 max-w-[180px]">{msg.file_name}</span>
                </a>
              )}
            </>
          ) : (
            <div className="prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            </div>
          )}
          {msg.media_url && (
            <img
              src={msg.media_url}
              alt="Agent response"
              className="mt-2 rounded-lg max-w-full max-h-96"
            />
          )}
        </div>
        <span className="text-xs text-gray-400">
          {msg.created_at
            ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : ""}
        </span>
      </div>

      {isUser && <UserAvatar />}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <PreddiAvatar />
      <div className="px-4 py-3 rounded-2xl rounded-bl-[4px] flex items-center gap-1 bg-white border border-[#e5e7eb]">
        {["[animation-delay:0s]", "[animation-delay:0.2s]", "[animation-delay:0.4s]"].map((delayCls, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full bg-[#308AD8] opacity-70 animate-typing ${delayCls}`}
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
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 scrollbar-thin">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-3 sm:gap-4">
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-[#308AD8]/10">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#308AD8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg text-[#0A222C]">How can I help you?</h3>
            <p className="text-sm mt-1 text-gray-400">Select an agent below, then type your message</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <Message key={`${msg.id ?? ""}-${i}`} msg={msg} />
        ))}

        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
