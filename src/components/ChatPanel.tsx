import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, MapPin, Minimize2, Trash2, ArrowRight, CornerRightUp } from "lucide-react";
import { Message } from "../types";
import { motion, AnimatePresence } from "motion/react";

const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(" ");
};

export function ShiningText({ text, className = "text-xs font-semibold" }: { text: string; className?: string }) {
  return (
    <motion.span
      className={`bg-[linear-gradient(110deg,#475569,35%,#94a3b8,50%,#475569,75%,#475569)] bg-[length:200%_100%] bg-clip-text text-transparent inline-block ${className}`}
      initial={{ backgroundPosition: "200% 0" }}
      animate={{ backgroundPosition: "-200% 0" }}
      transition={{
        repeat: Infinity,
        duration: 2,
        ease: "linear",
      }}
    >
      {text.split("\n").map((line, i) => (
        <React.Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </React.Fragment>
      ))}
    </motion.span>
  );
}

interface AIInputWithLoadingProps {
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  onSubmit: (value: string) => void;
  className?: string;
  isLoading: boolean;
}

export function AIInputWithLoading({
  id = "ai-input-with-loading",
  placeholder = "Ask me anything!",
  minHeight = 48,
  maxHeight = 150,
  onSubmit,
  className,
  isLoading
}: AIInputWithLoadingProps) {
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = (reset = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    if (reset) {
      textarea.style.height = `${minHeight}px`;
      return;
    }
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [inputValue]);

  const isSubmitted = isLoading || submitted;

  const handleSubmit = () => {
    if (!inputValue.trim() || isSubmitted) return;
    
    setSubmitted(true);
    onSubmit(inputValue);
    setInputValue("");
    adjustHeight(true);
    
    // Safety fallback release state
    const timeout = setTimeout(() => {
      setSubmitted(false);
    }, 6000);
    return () => clearTimeout(timeout);
  };

  // Reset internal lock state when actual loading completes
  useEffect(() => {
    if (!isLoading) {
      setSubmitted(false);
    }
  }, [isLoading]);

  return (
    <div className="w-full shrink-0 flex flex-col gap-1.5 mt-auto px-1 py-1">
      <div className="relative w-full">
        <textarea
          id={id}
          placeholder={placeholder}
          className={cn(
            "w-full bg-white/80 border border-slate-200/70 rounded-2xl pl-4 pr-11 py-3 text-slate-900 placeholder-slate-400/80 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none font-medium text-sm leading-relaxed shadow-sm transition-all duration-200 max-md:bg-white/20 max-md:backdrop-blur-lg max-md:border-white/30 max-md:shadow-inner",
            isSubmitted ? "opacity-75 bg-slate-50/50 cursor-not-allowed" : "hover:bg-white/95 focus:bg-white max-md:hover:bg-white/30 max-md:focus:bg-white/30",
            className
          )}
          style={{
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`,
          }}
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            adjustHeight();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          disabled={isSubmitted}
        />
        
        <button
          onClick={handleSubmit}
          className={cn(
            "absolute right-2.5 top-2.5 rounded-xl p-2.5 transition-all duration-250 cursor-pointer active:scale-90 flex items-center justify-center",
            isSubmitted 
              ? "bg-transparent cursor-not-allowed" 
              : inputValue.trim() 
                ? "bg-slate-900 hover:bg-slate-800 text-white shadow-sm" 
                : "bg-slate-50 text-slate-300 hover:text-slate-500"
          )}
          type="button"
          disabled={isSubmitted || !inputValue.trim()}
        >
          {isSubmitted ? (
            <div
              className="w-4 h-4 bg-slate-800 rounded-sm animate-spin"
              style={{ animationDuration: "1.5s" }}
            />
          ) : (
            <CornerRightUp
              className="w-4.5 h-4.5"
            />
          )}
        </button>
      </div>
    </div>
  );
}

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onClearChat: () => void;
  locationState: {
    lat: number;
    lng: number;
    address: string;
  } | null;
  onLinkPlace?: (id: string) => void;
}

const PRESET_PROMPTS = [
  { label: "2hr Itinerary", text: "Draft a detailed, customized 2-hour walking tour with stop intervals." },
  { label: "Cozy Cafés", text: "Suggest a relaxed walk visiting the best specialty coffee spots nearby." },
  { label: "Cultural Walk", text: "Are there any interesting museums, historical landmarks, or art galleries nearby?" },
  { label: "Scenic & Nature", text: "Outline a quiet scenic walk passing through parks or open viewpoints." }
];

export default function ChatPanel({
  messages,
  onSendMessage,
  isLoading,
  onClearChat,
  locationState,
  onLinkPlace,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText("");
  };
  // Safe and super fast inline Markdown-like parser
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let content = line;
      
      // Headers
      if (content.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-sm font-bold text-slate-900 mt-4 mb-2 font-sans tracking-tight leading-snug flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
            {content.slice(4)}
          </h4>
        );
      }
      if (content.startsWith("## ")) {
        return <h3 key={idx} className="text-[14.5px] font-bold text-slate-950 mt-5 mb-2.5 border-b border-slate-200/50 pb-1.5 tracking-tight">{content.slice(3)}</h3>;
      }
      if (content.startsWith("# ")) {
        return <h2 key={idx} className="text-base font-extrabold text-slate-950 mt-6 mb-3 tracking-tight">{content.slice(2)}</h2>;
      }

      // Check bullet items
      const isBullet = content.startsWith("- ") || content.startsWith("* ");
      if (isBullet) {
        content = content.slice(2);
      }

      // Parse bold **text**
      const parts = content.split(/\*\*(.*?)\*\*/);
      const parsedElements = parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <strong key={pIdx} className="font-bold text-slate-950">{part}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={idx} className="ml-5 list-disc text-slate-700 text-sm py-1.5 leading-relaxed">
            {parsedElements}
          </li>
        );
      }

      if (content.trim() === "") {
        return <div key={idx} className="h-2.5" />;
      }

      return (
        <p key={idx} className="text-sm text-slate-705 py-1 leading-relaxed font-normal">
          {parsedElements}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-slate-800 bg-transparent animate-fade-in" id="chat-panel">
      {/* Header */}
      {messages.length > 0 && (
        <div className="flex justify-between items-center border-b border-slate-200/40 pb-3.5 mb-3.5 shrink-0">
          <button
            onClick={onClearChat}
            title="Clear Chat History"
            className="px-3.5 py-1.5 rounded-xl bg-white/50 hover:bg-white text-slate-700 hover:text-slate-950 hover:scale-[1.02] shadow-sm transition-all text-xs font-bold flex items-center gap-1.5 border border-white/80 max-md:bg-white/20 max-md:border-white/30 max-md:backdrop-blur-md active:scale-95"
          >
            <Trash2 className="h-4 w-4 text-slate-600" />
            Clear Chat
          </button>
        </div>
      )}

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-1 py-1 pr-1.5 scrollbar-none no-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-end min-h-full text-center pb-2 px-2">
            <h4 className="text-base font-bold text-slate-950 tracking-tight">
              <ShiningText text={"Hi, I'm WalkieTalkies!\nWhere do you want to go today?"} className="text-base font-extrabold" />
            </h4>
            
            {/* Presets */}
            <div className="w-full grid grid-cols-2 gap-3.5 mt-6 max-w-md">
              {PRESET_PROMPTS.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => onSendMessage(preset.text)}
                  className="p-3.5 text-left rounded-2xl bg-white/50 border border-white hover:border-slate-300 hover:bg-white/80 max-md:bg-white/20 max-md:border-white/25 max-md:backdrop-blur-md hover:max-md:bg-white/30 transition-all duration-300 group shadow-sm hover:scale-[1.01] active:scale-95"
                >
                  <span className="text-xs font-bold text-slate-900 block mb-1 group-hover:text-slate-950">{preset.label}</span>
                  <span className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-3">{preset.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-[20px] p-4 shadow-sm ${
                      isUser
                        ? "bg-slate-900 border border-slate-950 text-white rounded-tr-none shadow-md shadow-slate-950/5 font-normal"
                        : msg.isError
                          ? "bg-red-50/80 border border-red-200 text-red-900 rounded-tl-none"
                          : "bg-white/70 border border-white text-slate-900 rounded-tl-none backdrop-blur-sm max-md:bg-white/25 max-md:backdrop-blur-md max-md:border-white/20"
                    }`}
                  >
                    <div className="text-sm leading-relaxed break-words">
                      {isUser ? <p className="leading-relaxed text-sm font-medium">{msg.text}</p> : (
                          <div className="space-y-1.5">
                            {renderMarkdown(msg.text)}
                            {msg.linkedPlaceId && (
                                <button
                                    onClick={() => {                
                                        if (onLinkPlace) onLinkPlace(msg.linkedPlaceId!);
                                    }}
                                    className="mt-3.5 text-xs font-bold tracking-tight text-slate-900 bg-white border border-slate-200 max-md:bg-white/25 max-md:border-white/30 max-md:backdrop-blur-sm px-3.5 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
                                >
                                    <MapPin className="h-4 w-4 text-emerald-500" />
                                    <span>Zoom & Highlight on Map</span>
                                </button>
                            )}
                          </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block text-right mt-2 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}


            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/70 border border-white rounded-[20px] rounded-tl-none p-4 max-w-[85%] select-none backdrop-blur-sm shadow-sm animate-pulse max-md:bg-white/25 max-md:backdrop-blur-md max-md:border-white/20">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs ml-1 flex items-center">
                      <ShiningText text="WalkieTalkies is charting your paths..." className="text-xs font-bold" />
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <AIInputWithLoading
        onSubmit={onSendMessage}
        isLoading={isLoading}
        placeholder="Ask me anything..."
      />
    </div>
  );
}

