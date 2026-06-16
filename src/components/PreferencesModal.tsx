import { motion } from "motion/react";
import { Sliders, X, Check } from "lucide-react";
import { UserPreferences } from "../types";

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: UserPreferences) => void;
}

const AVAILABLE_INTERESTS = [
  "Specialty Coffee",
  "Tea & Bakeries",
  "Art Museums",
  "History & Monuments",
  "Public Parks & Nature",
  "Live Music & Theatre",
  "Local Boutiques & Design",
  "Scenic Viewpoints",
  "Arcade & Games"
];

export default function PreferencesModal({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences
}: PreferencesModalProps) {
  if (!isOpen) return null;

  const toggleInterest = (interest: string) => {
    const updatedInterests = preferences.interests.includes(interest)
      ? preferences.interests.filter(i => i !== interest)
      : [...preferences.interests, interest];
    onUpdatePreferences({ ...preferences, interests: updatedInterests });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-white/60 bg-white/70 p-6 text-slate-900 shadow-2xl backdrop-blur-3xl md:p-8"
        id="prefs-modal"
      >
        <div className="flex items-center justify-between border-b border-white/20 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Sliders className="h-4.5 w-4.5 text-slate-900" />
            <span className="text-base font-extrabold tracking-tight text-slate-900">Preferences</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 bg-white/40 border border-white/60 hover:bg-white/80 hover:text-slate-900 shadow-sm transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Max Walking Distance */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-500">Max Walking Distance</label>
              <span className="text-[10px] font-mono font-bold text-slate-900 bg-white/60 border border-white/80 px-2.5 py-0.5 rounded-full shadow-sm">{preferences.maxWalkingDistance}m ({(preferences.maxWalkingDistance / 1000).toFixed(1)} km)</span>
            </div>
            <input
              type="range"
              min="300"
              max="2000"
              step="100"
              value={preferences.maxWalkingDistance}
              onChange={(e) => onUpdatePreferences({ ...preferences, maxWalkingDistance: parseInt(e.target.value) })}
              className="w-full h-1 bg-white border border-white/85 rounded-lg appearance-none cursor-pointer accent-[#CCD8ED]"
            />
            <div className="flex justify-between text-[10px] text-slate-450 font-mono mt-1.5 w-full">
              <span>300m (3m walk)</span>
              <span>2km (20m walk)</span>
            </div>
          </div>

          {/* Pace selector */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-2">Walking Pace</label>
            <div className="grid grid-cols-3 gap-2">
              {(["relaxed", "moderate", "brisk"] as const).map((pace) => {
                const isActive = preferences.pace === pace;
                let activeStyle = "";
                if (isActive) {
                  if (pace === "relaxed") {
                    activeStyle = "bg-[#ECCF95]/55 border-[#ECCF95]/90 text-amber-950 shadow-sm shadow-[#ECCF95]/20";
                  } else if (pace === "moderate") {
                    activeStyle = "bg-[#CCD8ED]/65 border-[#CCD8ED]/95 text-slate-950 shadow-sm shadow-[#CCD8ED]/20";
                  } else {
                    activeStyle = "bg-[#CBEC95]/55 border-[#CBEC95]/90 text-emerald-900 shadow-sm shadow-[#CBEC95]/20";
                  }
                } else {
                  activeStyle = "bg-white/40 border-white/80 text-slate-600 hover:text-slate-950 hover:bg-white hover:border-slate-250";
                }

                return (
                  <button
                    key={pace}
                    onClick={() => onUpdatePreferences({ ...preferences, pace })}
                    className={`py-2.5 px-3 rounded-2xl text-[11px] font-bold capitalize border transition-all duration-300 ${activeStyle}`}
                  >
                    {pace === "relaxed" && "Relaxed"}
                    {pace === "moderate" && "Moderate"}
                    {pace === "brisk" && "Brisk"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interests checklist */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-2">Primary Interests</label>
            <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[200px] pr-1 no-scrollbar pb-1">
              {AVAILABLE_INTERESTS.map((interest) => {
                const isSelected = preferences.interests.includes(interest);
                let tagClass = "";
                let checkTextClass = "text-slate-500";
                if (isSelected) {
                  // Alternate colors dynamically based on string content
                  const hash = interest.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
                  const colorsIndex = hash % 3;
                  if (colorsIndex === 0) {
                    tagClass = "bg-[#ECCF95]/55 border-[#ECCF95]/90 text-amber-950 shadow-sm";
                    checkTextClass = "text-amber-900";
                  } else if (colorsIndex === 1) {
                    tagClass = "bg-[#CBEC95]/55 border-[#CBEC95]/90 text-slate-900 shadow-sm";
                    checkTextClass = "text-slate-900";
                  } else {
                    tagClass = "bg-[#CCD8ED]/65 border-[#CCD8ED]/95 text-slate-950 shadow-sm";
                    checkTextClass = "text-slate-950";
                  }
                } else {
                  tagClass = "bg-white/40 border-white/80 text-slate-600 hover:text-slate-950 hover:bg-white/85 hover:border-slate-200";
                }

                return (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`flex items-center gap-2.5 px-3.5 py-2 rounded-[16px] text-xs font-bold transition-all duration-300 border cursor-pointer ${tagClass}`}
                  >
                    <span>{interest}</span>
                    <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center border shrink-0 transition-all duration-300 ${
                      isSelected ? "bg-white border-white" : "border-slate-300 bg-white/50"
                    }`}>
                      {isSelected && <Check className={`h-2.5 w-2.5 stroke-[3.5px] ${checkTextClass}`} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end border-t border-white/20 pt-5">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-[20px] bg-slate-900 hover:bg-slate-950 text-white font-black tracking-tight transition-all duration-300 active:scale-[0.98] shadow-md shadow-slate-900/10 border border-slate-800"
          >
            Apply Preferences
          </button>
        </div>
      </motion.div>
    </div>
  );
}

