import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, MapPin, Minimize2, Trash2, ArrowRight } from "lucide-react";
import { Message } from "../types";
import { motion, AnimatePresence } from "motion/react";

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
        return <h4 key={idx} className="text-sm font-bold text-sky-800 mt-3 mb-1">{content.slice(4)}</h4>;
      }
      if (content.startsWith("## ")) {
        return <h3 key={idx} className="text-base font-bold text-sky-900 mt-4 mb-2 border-b border-slate-200 pb-1">{content.slice(3)}</h3>;
      }
      if (content.startsWith("# ")) {
        return <h2 key={idx} className="text-lg font-bold text-slate-950 mt-4 mb-2">{content.slice(2)}</h2>;
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
          return <strong key={pIdx} className="font-semibold text-sky-800">{part}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-700 text-sm py-1 leading-relaxed">
            {parsedElements}
          </li>
        );
      }

      if (content.trim() === "") {
        return <div key={idx} className="h-2.5" />;
      }

      return (
        <p key={idx} className="text-sm text-slate-700 py-1 leading-relaxed">
          {parsedElements}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-slate-800 bg-white" id="chat-panel">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-sky-500 animate-pulse" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            WalkieTalkies Chat
          </h3>
        </div>
        
        {messages.length > 0 && (
          <button
            onClick={onClearChat}
            title="Clear Chat History"
            className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all text-xs font-medium flex items-center gap-1 border border-slate-200"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 scrollbar-none no-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-4 shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <h4 className="text-base font-semibold text-slate-950">Howdy, I'm WalkieTalkies!</h4>
            <p className="text-sm text-slate-600 max-w-xs mt-1 leading-relaxed">
              I analyze verified places around you to render detailed schedules and walks. Ask for specific ideas or try a preset below.
            </p>
            
            {locationState ? (
              <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-700">
                <MapPin className="h-3.5 w-3.5 text-sky-600" />
                <span className="truncate max-w-48">Tethered: {locationState.address?.split(",")[0] || "Active Coordinate"}</span>
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
                Tap geolocation or search an address above to discover nearby spots!
              </p>
            )}

            {/* Presets */}
            <div className="w-full grid grid-cols-2 gap-3 mt-8">
              {PRESET_PROMPTS.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => onSendMessage(preset.text)}
                  className="p-3 text-left rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-100 transition-all duration-300 group"
                >
                  <span className="text-xs font-semibold text-sky-700 block mb-1">{preset.label}</span>
                  <span className="text-xs text-slate-600 leading-normal line-clamp-2">{preset.text}</span>
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
                    className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                      isUser
                        ? "bg-sky-600 text-white rounded-tr-none"
                        : msg.isError
                          ? "bg-red-50 border border-red-100 text-red-900 rounded-tl-none"
                          : "bg-slate-100 border border-slate-200 text-slate-900 rounded-tl-none"
                    }`}
                  >
                    <div className="text-sm break-words">
                      {isUser ? <p className="leading-relaxed">{msg.text}</p> : (
                          <>
                            {renderMarkdown(msg.text)}
                            {msg.linkedPlaceId && (
                                <button
                                    onClick={() => {                
                                        if (onLinkPlace) onLinkPlace(msg.linkedPlaceId!);
                                    }}
                                    className="mt-3 text-xs font-medium text-sky-800 bg-white border border-sky-200 px-3 py-2 rounded-lg shadow-sm hover:bg-sky-50 transition-colors flex items-center gap-1.5"
                                >
                                    <MapPin className="h-4 w-4" />
                                    Show on map
                                </button>
                            )}
                          </>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block text-right mt-2 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}


            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 border border-slate-200 rounded-2xl rounded-tl-none p-4 max-w-[85%] select-none">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="h-1.5 w-1.5 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="h-1.5 w-1.5 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    <span className="text-[11px] text-slate-600 ml-1 font-semibold">WalkieTalkies is planning walking routes...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Inputs Form */}
      <form onSubmit={handleSubmit} className="bg-slate-100 border border-slate-200 p-1.5 rounded-2xl flex items-center gap-2 mt-auto">
        <div className="p-2 hover:bg-white rounded-xl text-slate-500 transition-colors">
          <Sparkles className="h-4.5 w-4.5 text-sky-600 animate-pulse" />
        </div>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isLoading ? "WalkieTalkies is drafting..." : "Where to next? Ask me anything..."}
          disabled={isLoading}
          className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-xs py-2 px-1 text-slate-900 font-medium placeholder-slate-400"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="w-9 h-9 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-95 shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

