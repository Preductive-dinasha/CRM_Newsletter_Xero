import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageSquare, FileText } from "lucide-react";
import { SkillBadge } from "./SkillSelector";

function PaiAvatar() {
  return (
    <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 bg-[#0d2678] shadow-sm">
      <MessageSquare size={15} strokeWidth={2.4} className="text-white" />
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-semibold text-white bg-[#2a3e8f] shadow-sm">
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
    ? "px-4 py-3 text-sm leading-relaxed bg-[#0d2678] text-white rounded-lg rounded-br-sm shadow-sm"
    : isError
    ? "px-4 py-3 text-sm leading-relaxed bg-[#ffdad6] text-[#ba1a1a] border border-[#ffdad6] rounded-lg rounded-bl-sm"
    : "px-4 py-3 text-sm leading-relaxed bg-white text-[#1f1b17] border border-[#eae1db] rounded-lg rounded-bl-sm shadow-sm";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <PaiAvatar />}

      <div className={`max-w-[95%] sm:max-w-[85%] md:max-w-[80%] flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
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
                  className="mt-2 rounded-md max-w-full max-h-60"
                />
              )}
              {msg.file_name && !msg.file_preview && (
                <a
                  href={msg.file_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-2 px-3 py-2 rounded-md bg-white/15 border border-white/20 hover:bg-white/25 transition duration-150 ease-out no-underline"
                  onClick={!msg.file_url ? (e) => e.preventDefault() : undefined}
                >
                  <FileText size={14} className="flex-shrink-0 opacity-80" />
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
              className="mt-2 rounded-md max-w-full max-h-96"
            />
          )}
        </div>
        <span className="text-[11px] text-[#757683] mt-0.5">
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
      <PaiAvatar />
      <div className="px-4 py-3 rounded-lg rounded-bl-sm flex items-center gap-1.5 bg-white border border-[#eae1db] shadow-sm">
        {["[animation-delay:0s]", "[animation-delay:0.2s]", "[animation-delay:0.4s]"].map((delayCls, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full bg-[#0d2678] opacity-70 animate-typing ${delayCls}`}
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
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-10 py-6 sm:py-8 scrollbar-thin bg-[#fff8f5]">
      <div className="w-full flex flex-col gap-5">
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-72 text-center">
            <div className="w-20 h-20 rounded-lg flex items-center justify-center mb-5 bg-[#dde1ff] shadow-sm">
              <MessageSquare size={36} strokeWidth={1.8} className="text-[#0d2678]" />
            </div>
            <h3 className="font-bold text-2xl text-[#0d2678] mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              How can I help you?
            </h3>
            <p className="text-sm text-[#757683]">Select an agent below, then type your message</p>
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
