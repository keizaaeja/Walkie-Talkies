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
  "Scenic Viewpoints"
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
        className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl backdrop-blur-3xl md:p-8"
        id="prefs-modal"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-sky-600" />
            <span className="text-base font-semibold tracking-tight text-slate-950">Travel Preferences</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Max Walking Distance */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-500">Max Walking Distance</label>
              <span className="text-xs font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">{preferences.maxWalkingDistance}m ({(preferences.maxWalkingDistance / 1000).toFixed(1)} km)</span>
            </div>
            <input
              type="range"
              min="300"
              max="2000"
              step="100"
              value={preferences.maxWalkingDistance}
              onChange={(e) => onUpdatePreferences({ ...preferences, maxWalkingDistance: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 w-full">
              <span>300m (3 min walk)</span>
              <span>2km (20 min walk)</span>
            </div>
          </div>

          {/* Pace selector */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-2">Walking Pace</label>
            <div className="grid grid-cols-3 gap-2">
              {(["relaxed", "moderate", "brisk"] as const).map((pace) => (
                <button
                  key={pace}
                  onClick={() => onUpdatePreferences({ ...preferences, pace })}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium capitalize border transition-all duration-300 ${
                    preferences.pace === pace
                      ? "bg-sky-50 border-sky-600 text-sky-800 shadow-sm"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {pace === "relaxed" && "Relaxed"}
                  {pace === "moderate" && "Moderate"}
                  {pace === "brisk" && "Brisk"}
                </button>
              ))}
            </div>
          </div>

          {/* Interests checklist */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-2">Primary Interests</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
              {AVAILABLE_INTERESTS.map((interest) => {
                const isSelected = preferences.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`flex items-center justify-between p-3 rounded-xl text-xs font-medium text-left border transition-all duration-300 ${
                      isSelected
                        ? "bg-sky-50 border-sky-300 text-sky-900 shadow-sm"
                        : "bg-slate-50 border-slate-100 text-slate-600 hover:text-slate-900 hover:border-slate-200"
                    }`}
                  >
                    <span>{interest}</span>
                    <div className={`h-4.5 w-4.5 rounded-lg flex items-center justify-center border transition-all duration-300 ${
                      isSelected ? "bg-sky-600 border-sky-600 text-white" : "border-slate-300"
                    }`}>
                      {isSelected && <Check className="h-3 w-3 stroke-[3px]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end border-t border-slate-100 pt-5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-semibold tracking-tight transition-all duration-300 active:scale-95 shadow-md hover:shadow-lg hover:scale-[1.01]"
          >
            Apply Preferences
          </button>
        </div>
      </motion.div>
    </div>
  );
}

