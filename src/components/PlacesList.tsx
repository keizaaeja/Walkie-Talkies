import { Coffee, Landmark, Sparkles, MapPin, Search, Compass, MessageSquareCode, Plus, Check } from "lucide-react";
import { Place } from "../types";
import { useState } from "react";

interface PlacesListProps {
  places: Place[];
  selectedPlaceId: string | null;
  itinerary: Place[];
  onToggleItinerary: (place: Place) => void;
  onSelectPlace: (place: Place) => void;
  onAskAIAboutPlace: (place: Place) => void;
  loading: boolean;
}

export default function PlacesList({
  places,
  selectedPlaceId,
  itinerary,
  onToggleItinerary,
  onSelectPlace,
  onAskAIAboutPlace,
  loading
}: PlacesListProps) {
  const [filter, setFilter] = useState<"all" | "cafe" | "museum" | "attraction" | "activity">("all");

  const filteredPlaces = filter === "all" 
    ? places 
    : places.filter(p => p.category === filter);

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case "cafe":
        return {
          bg: "bg-amber-100 text-amber-800 border-amber-200",
          icon: <Coffee className="h-3.5 w-3.5" />
        };
      case "museum":
        return {
          bg: "bg-sky-100 text-sky-800 border-sky-200",
          icon: <Landmark className="h-3.5 w-3.5" />
        };
      case "attraction":
        return {
          bg: "bg-indigo-100 text-indigo-800 border-indigo-200",
          icon: <Compass className="h-3.5 w-3.5" />
        };
      case "activity":
        return {
          bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
          icon: <Sparkles className="h-3.5 w-3.5" />
        };
      default:
        return {
          bg: "bg-slate-100 text-slate-800 border-slate-200",
          icon: <MapPin className="h-3.5 w-3.5" />
        };
    }
  };

  return (
    <div className="flex flex-col h-full text-slate-800 overflow-hidden" id="places-list">
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none no-scrollbar">
        {(["all", "cafe", "museum", "attraction", "activity"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all duration-300 border ${
              filter === cat
                ? "bg-sky-600 border-sky-600 text-white shadow-sm"
                : "bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900"
            }`}
          >
            {cat === "all" ? "🌐 All Nearby" : cat === "cafe" ? "☕ Cafés" : cat === "museum" ? "🎨 Museums" : cat === "attraction" ? "🏛️ Landmarks" : "🏃 Activities"}
          </button>
        ))}
      </div>

      {/* Places List Container */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-none no-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mb-3"></div>
            <p className="text-xs font-semibold">Tethering coordinates & places...</p>
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
            <Search className="h-8 w-8 text-slate-400 mb-3" />
            <p className="text-xs font-bold text-slate-600">No walking-distance places identified</p>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1.5 leading-relaxed">
              Try expanding your maximum walking range in Preferences or searching around a different address point.
            </p>
          </div>
        ) : (
          filteredPlaces.map((place) => {
            const isSelected = selectedPlaceId === place.id;
            const theme = getCategoryTheme(place.category);

            return (
              <div
                key={place.id}
                onClick={() => onSelectPlace(place)}
                className={`group relative rounded-2xl p-4 border transition-all duration-300 cursor-pointer flex flex-col gap-3 ${
                  isSelected
                    ? "bg-sky-50 border-sky-200 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {/* Visual Glow Indicator */}
                {isSelected && (
                  <div className="absolute left-0 top-3.5 bottom-3.5 w-1 bg-sky-600 rounded-r-md" />
                )}

                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border flex items-center gap-1.5 leading-none ${theme.bg}`}>
                        {theme.icon}
                        <span className="capitalize">{place.category}</span>
                      </span>
                      {place.distanceMeters !== undefined && (
                        <span className="text-[10px] text-slate-500 font-mono tracking-tight font-bold">
                          🚶 {place.distanceMeters}m ({Math.round(place.distanceMeters / 80)} min)
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-slate-950 leading-snug group-hover:text-sky-700 transition-colors duration-300">
                      {place.name}
                    </h4>

                    {place.rating && (
                      <div className="flex items-center gap-1 mt-1 text-xs">
                        <span className="text-amber-500 font-semibold">★</span>
                        <span className="font-medium text-slate-800">{place.rating.toFixed(1)}</span>
                        {place.reviewsCount !== undefined && (
                          <span className="text-slate-500 font-medium">({place.reviewsCount})</span>
                        )}
                      </div>
                    )}

                    {place.formattedAddress && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-2">
                        {place.formattedAddress}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleItinerary(place);
                      }}
                      title="Toggle Itinerary"
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-300 border ${
                          itinerary.find(p => p.id === place.id)
                          ? "bg-sky-50 border-sky-300 text-sky-700 hover:bg-sky-100"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                  >
                      {itinerary.find(p => p.id === place.id) ? (
                        <><Check className="h-3.5 w-3.5" /> Added</>
                      ) : (
                        <><Plus className="h-3.5 w-3.5" /> Add</>
                      )}
                  </button>
                  <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAskAIAboutPlace(place);
                      }}
                      title="Ask AI WalkieTalkies about this"
                      className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-sky-50 text-slate-500 hover:text-sky-600 transition-all duration-300 border border-slate-200 hover:border-sky-300 flex items-center justify-center"
                  >
                      <MessageSquareCode className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

