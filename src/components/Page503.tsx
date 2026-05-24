import { useState } from "react";

export default function Page503() {
  const [progress] = useState(65);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 p-6 overflow-hidden font-sans">
      {/* Background blobs */}
      <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-blue-400 opacity-20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-52 h-52 rounded-full bg-blue-300 opacity-20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-10 max-w-2xl w-full">
        {/* Left — big 503 + plug icon */}
        <div className="relative flex-shrink-0">
          <span
            className="block text-[120px] sm:text-[140px] font-extrabold leading-none tracking-tighter select-none"
            style={{
              fontFamily: "'Syne', sans-serif",
              background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 40%, #60a5fa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            503
          </span>

          {/* Cute plug icon */}
          <div className="absolute -bottom-3 -right-4">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="36" cy="36" r="30" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
              <rect x="28" y="16" width="6" height="14" rx="3" fill="#2563eb" />
              <rect x="38" y="16" width="6" height="14" rx="3" fill="#2563eb" />
              <path d="M22 32h28v4a14 14 0 01-28 0v-4z" fill="#3b82f6" />
              <path d="M30 46v8M42 46v8" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="30" cy="57" r="3" fill="#60a5fa" />
              <circle cx="42" cy="57" r="3" fill="#60a5fa" />
              <circle cx="33" cy="38" r="2" fill="white" />
              <circle cx="39" cy="38" r="2" fill="white" />
            </svg>
          </div>
        </div>

        {/* Right — text + actions */}
        <div className="flex-1">

          <h1 className="text-2xl font-bold text-slate-900 mb-2 leading-snug">
            We'll be back<br />in a moment 💙
          </h1>

          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Our server took a little nap — probably needed it honestly.
            We're on it! Grab a coffee while we get things back up and running.
          </p>
        </div>
      </div>
    </div>
  );
}
