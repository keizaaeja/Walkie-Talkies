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
          bg: "bg-[#ECCF95]/45 text-amber-950 border-[#ECCF95]/60",
          icon: <Coffee className="h-3 w-3" />
        };
      case "museum":
        return {
          bg: "bg-[#CCD8ED]/45 text-slate-900 border-[#CCD8ED]/65",
          icon: <Landmark className="h-3 w-3" />
        };
      case "attraction":
        return {
          bg: "bg-indigo-100/50 text-indigo-950 border-indigo-200/50",
          icon: <Compass className="h-3 w-3" />
        };
      case "activity":
        return {
          bg: "bg-[#CBEC95]/45 text-slate-850 border-[#CBEC95]/60",
          icon: <Sparkles className="h-3 w-3" />
        };
      default:
        return {
          bg: "bg-slate-100/55 text-slate-900 border-slate-200/50",
          icon: <MapPin className="h-3 w-3" />
        };
    }
  };

  return (
    <div className="flex flex-col h-full text-slate-800 overflow-hidden" id="places-list">
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none no-scrollbar shrink-0">
        {(["all", "cafe", "museum", "attraction", "activity"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all duration-300 border cursor-pointer active:scale-95 ${
              filter === cat
                ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10"
                : "bg-white/50 hover:bg-white border-white/80 max-md:bg-white/20 max-md:border-white/25 max-md:backdrop-blur-sm text-slate-600 hover:text-slate-950 hover:border-slate-300"
            }`}
          >
            {cat === "all" ? "All Nearby" : cat === "cafe" ? "Cafés" : cat === "museum" ? "Museums" : cat === "attraction" ? "Landmarks" : "Activities"}
          </button>
        ))}
      </div>

      {/* Places List Container */}
      <div className="flex-1 overflow-y-auto space-y-4 py-2 px-2.5 mx-0.5 scrollbar-none no-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mb-4"></div>
            <p className="text-xs font-bold text-slate-700 font-mono tracking-wide">Scanning nearby spots...</p>
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 bg-white/30 rounded-2xl p-6 border border-white max-md:bg-white/10 max-md:border-white/20 max-md:backdrop-blur-md mt-4">
            <Search className="h-10 w-10 text-slate-400 mb-4" />
            <p className="text-sm font-bold text-slate-800">No places inside walking-range</p>
            <p className="text-xs text-slate-500 max-w-xs mt-2 leading-relaxed">
              Try adjusting your max walking distance in Preferences (up to 2km) or searching near another coordinates anchor.
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
                className={`group relative rounded-[22px] p-5 border transition-all duration-300 cursor-pointer flex flex-col gap-4 hover:scale-[1.005] ${
                  isSelected
                    ? "bg-white border-slate-900 shadow-md border-[1.5px] max-md:bg-white/45 max-md:border-slate-950/60 max-md:backdrop-blur-lg"
                    : "bg-white/50 border-white/80 hover:bg-white hover:border-slate-300 shadow-sm max-md:bg-white/15 max-md:border-white/20 max-md:backdrop-blur-md hover:max-md:bg-white/25"
                }`}
              >

                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5 leading-none ${theme.bg}`}>
                        {theme.icon}
                        <span>{place.category}</span>
                      </span>
                      {place.distanceMeters !== undefined && (
                        <span className="text-[11px] text-slate-600 font-mono font-bold">
                          🚶 {place.distanceMeters}m ({Math.round(place.distanceMeters / 80)}m walk)
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-950 leading-snug group-hover:text-slate-900 transition-colors duration-300">
                      {place.name}
                    </h4>

                    {place.rating ? (
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                        <span className="text-amber-505 text-amber-500 font-bold">★</span>
                        <span className="font-extrabold text-slate-800">{place.rating.toFixed(1)}</span>
                        {place.reviewsCount !== undefined && (
                          <span className="text-slate-400 font-semibold">({place.reviewsCount} reviews)</span>
                        )}
                      </div>
                    ) : null}

                    {place.formattedAddress && (
                      <p className="text-xs text-slate-550 leading-relaxed line-clamp-1 mt-2.5">
                        {place.formattedAddress}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center gap-2 pt-3.5 border-t border-slate-100">
                  <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleItinerary(place);
                      }}
                      title="Toggle Itinerary"
                      className={`flex-1 px-4 py-2 h-[38px] rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all duration-300 border cursor-pointer active:scale-95 ${
                          itinerary.find(p => p.id === place.id)
                          ? "bg-slate-900 border-slate-900 text-white hover:bg-slate-800"
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm max-md:bg-white/20 max-md:border-white/25 max-md:backdrop-blur-sm hover:max-md:bg-white/30"
                      }`}
                  >
                      {itinerary.find(p => p.id === place.id) ? (
                        <><Check className="h-4 w-4 stroke-[2.5px]" /> Added to Path</>
                      ) : (
                        <><Plus className="h-4 w-4 stroke-[2.5px]" /> Add to Walk Path</>
                      )}
                  </button>
                  <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAskAIAboutPlace(place);
                      }}
                      title="Ask AI WalkieTalkies about this"
                      className="px-3.5 py-2 h-[38px] w-[38px] rounded-xl bg-white hover:bg-slate-50 text-slate-705 hover:text-slate-950 transition-all duration-300 border border-slate-200 flex items-center justify-center shadow-sm max-md:bg-white/20 max-md:border-white/25 max-md:backdrop-blur-sm hover:max-md:bg-white/30 cursor-pointer active:scale-95"
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

